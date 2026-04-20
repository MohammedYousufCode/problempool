import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const UNLOCK_COST   = 10
const AI_BUILD_COST = 15

// Supported Groq models in priority order (fallback if primary is unavailable)
const GROQ_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama3-70b-8192',
  'llama3-8b-8192',
]

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    // ── 1. Authenticate via supabase.auth.getUser() ──────────────────────────
    // This correctly handles both HS256 and ES256 JWTs — no manual JWT parsing.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ message: 'Unauthorized' }, 401)
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) {
      console.error('Auth error:', authErr?.message)
      return json({ message: 'Unauthorized' }, 401)
    }

    const user_id = user.id

    // ── 2. Parse body ─────────────────────────────────────────────────────────
    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return json({ message: 'Invalid JSON body' }, 400)
    }

    const { action, problem_id, problem } = body as {
      action?: string
      problem_id?: string
      problem?: { title?: string; description?: string; who_faces_it?: string }
    }

    if (!action || !problem_id || typeof problem_id !== 'string') {
      return json({ message: 'Missing action or problem_id' }, 400)
    }

    // Service-role client for all privileged DB operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── ACTION: unlock ────────────────────────────────────────────────────────
    if (action === 'unlock') {
      // Check if already unlocked — idempotent, safe to call multiple times
      const { data: existing } = await supabase
        .from('unlocked_problems')
        .select('problem_id')
        .eq('user_id', user_id)
        .eq('problem_id', problem_id)
        .maybeSingle()   // ✅ Returns null (not 406) when no row found

      if (existing) {
        console.log(`User ${user_id} already unlocked problem ${problem_id}`)
        return json({ success: true, already_unlocked: true })
      }

      // Verify the problem actually exists and is approved before charging
      const { data: problemExists } = await supabase
        .from('problems')
        .select('id')
        .eq('id', problem_id)
        .eq('is_approved', true)
        .maybeSingle()

      if (!problemExists) {
        return json({ message: 'Problem not found or not approved' }, 404)
      }

      // Atomic: deduct credits + create unlock record in a single DB transaction
      // The RPC rolls back everything if credits are insufficient
      const { error: rpcErr } = await supabase.rpc('unlock_problem_atomic', {
        p_user_id:    user_id,
        p_problem_id: problem_id,
        p_cost:       UNLOCK_COST,
      })

      if (rpcErr) {
        console.error('unlock_problem_atomic error:', rpcErr.message)
        const msg = rpcErr.message.toLowerCase().includes('insufficient')
          ? `Not enough credits. You need ${UNLOCK_COST} credits to unlock.`
          : 'Failed to unlock — please try again'
        return json({ message: msg }, 400)
      }

      console.log(`✅ User ${user_id} unlocked problem ${problem_id}`)
      return json({ success: true })
    }

    // ── ACTION: ai_build ──────────────────────────────────────────────────────
    if (action === 'ai_build') {
      // Must have unlocked the problem first before getting AI build plan
      const { data: isUnlocked } = await supabase
        .from('unlocked_problems')
        .select('problem_id')
        .eq('user_id', user_id)
        .eq('problem_id', problem_id)
        .maybeSingle()

      if (!isUnlocked) {
        return json({ message: 'You must unlock this problem before generating a build plan.' }, 403)
      }

      // Check if already purchased this build plan (idempotent — re-fetches cached result)
      const { data: existingTx } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user_id)
        .eq('reason', `AI Build Panel: ${problem_id}`)
        .maybeSingle()   // ✅ Fix: was .single() which caused 406 when no row found

      const alreadyPurchased = !!existingTx

      if (!alreadyPurchased) {
        // Deduct credits BEFORE calling Groq — prevents free rides if deduct fails after AI call
        const { error: deductErr } = await supabase.rpc('deduct_credits', {
          p_user_id: user_id,
          p_amount:  AI_BUILD_COST,
          p_reason:  `AI Build Panel: ${problem_id}`,
        })

        if (deductErr) {
          console.error('deduct_credits error:', deductErr.message)
          const msg = deductErr.message.toLowerCase().includes('insufficient')
            ? `Not enough credits. You need ${AI_BUILD_COST} credits for the AI Build Panel.`
            : 'Failed to deduct credits — please try again'
          return json({ message: msg }, 400)
        }
      }

      // ── Call Groq with model fallback ───────────────────────────────────────
      const GROQ_KEY = Deno.env.get('GROQ_API_KEY')
      if (!GROQ_KEY) {
        if (!alreadyPurchased) await refundCredits(supabase, user_id, AI_BUILD_COST, problem_id)
        return json({ message: 'AI service not configured — credits refunded' }, 503)
      }

      const prompt = buildPrompt(problem)
      let content = ''

      for (const model of GROQ_MODELS) {
        try {
          const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              max_tokens: 1000,
              temperature: 0.65,
              messages: [{ role: 'user', content: prompt }],
            }),
          })

          if (!groqResp.ok) {
            const errBody = await groqResp.json().catch(() => ({}))
            console.warn(`Groq model ${model} failed (${groqResp.status}):`, JSON.stringify(errBody))
            continue   // try next model
          }

          const groqData = await groqResp.json()
          content = groqData.choices?.[0]?.message?.content?.trim() ?? ''
          if (content) {
            console.log(`✅ Groq responded using model: ${model}`)
            break
          }
        } catch (fetchErr) {
          console.warn(`Groq fetch error for model ${model}:`, fetchErr)
        }
      }

      // All models failed — refund and return error
      if (!content) {
        if (!alreadyPurchased) await refundCredits(supabase, user_id, AI_BUILD_COST, problem_id)
        return json({ message: 'AI service unavailable — credits refunded. Please try again later.' }, 503)
      }

      return json({
        success: true,
        content,
        credits_deducted: !alreadyPurchased,
      })
    }

    return json({ message: `Unknown action: "${action}"` }, 400)

  } catch (err) {
    console.error('unlock-problem unhandled error:', err)
    return json({ message: 'Internal server error' }, 500)
  }
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

async function refundCredits(
  supabase: ReturnType<typeof createClient>,
  user_id: string,
  amount: number,
  problem_id: string
): Promise<void> {
  const { error } = await supabase.rpc('add_credits', {
    p_user_id: user_id,
    p_amount:  amount,
    p_reason:  `Refund: AI Build Panel failed for ${problem_id}`,
  })
  if (error) console.error('Refund failed:', error.message)
  else console.log(`💰 Refunded ${amount} credits to ${user_id}`)
}

function buildPrompt(
  problem?: { title?: string; description?: string; who_faces_it?: string }
): string {
  return `You are a senior startup technical advisor. Given the problem below, write a concise, practical build plan for a solo developer.

Problem: ${problem?.title ?? 'Untitled'}
Who faces it: ${problem?.who_faces_it ?? 'Not specified'}
Description: ${problem?.description ?? 'Not specified'}

Format your response exactly as:

## 3 Solution Approaches
1. [Approach name]: [one sentence]. Pro: [one sentence]. Con: [one sentence].
2. [Approach name]: [one sentence]. Pro: [one sentence]. Con: [one sentence].
3. [Approach name]: [one sentence]. Pro: [one sentence]. Con: [one sentence].

## Recommended Tech Stack
Frontend: [choice + reason]
Backend: [choice + reason]
Database: [choice + reason]
Key APIs/Services: [list]

## MVP Timeline (4 Weeks)
Week 1: [Core data model + auth task]
Week 2: [Main feature development task]
Week 3: [UI polish + testing task]
Week 4: [Launch prep + deployment task]

## Key Risks
- [Risk 1 + mitigation]
- [Risk 2 + mitigation]

Keep it specific, actionable, and realistic for a solo developer shipping in 4 weeks.`
}