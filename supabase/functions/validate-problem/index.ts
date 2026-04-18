import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { mode, problem } = await req.json()
    const GROQ = Deno.env.get('GROQ_API_KEY')!

    const groq = async (messages: { role: string; content: string }[], maxTokens = 800) => {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${GROQ}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          model: 'meta-llama/llama-4-scout-17b-16e-instruct', 
          messages, 
          max_tokens: maxTokens, 
          temperature: 0.7 
        }),
      })
      const d = await r.json()
      return d.choices?.[0]?.message?.content ?? ''
    }

    if (mode === 'build_plan') {
      const content = await groq([{
        role: 'user',
        content: `You are a startup technical advisor. For this problem statement, write a concise build plan:

Problem: ${problem.title}
Who faces it: ${problem.who_faces_it}
Description: ${problem.description}

Format your response as:

## 3 Solution Approaches
[3 numbered approaches, each with a one-line pro and con]

## Recommended Tech Stack
Frontend: ...
Backend: ...
Database: ...
Key APIs: ...

## MVP Timeline (4 Weeks)
Week 1: Core data model + auth
Week 2: Main feature development
Week 3: UI polish + testing
Week 4: Launch prep + deployment

Keep it practical for a solo developer.`
      }], 900)

      return new Response(
        JSON.stringify({ content }), 
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

    // mode === 'validate'
    const raw = await groq([
      { 
        role: 'system', 
        content: 'You are a problem statement quality reviewer. Respond ONLY with valid JSON, no markdown fences, no explanation.' 
      },
      { 
        role: 'user', 
        content: `Review this problem statement. Return a JSON object with these exact keys:
- ai_score: integer 0-100
- rejection_reason: string if score < 25 or spam, else null
- cleaned_title: improved title string
- cleaned_description: rewritten structured description
- quality_notes: one-line feedback string

Title: ${problem.title}
Who faces it: ${problem.who_faces_it}
Description: ${problem.description}
Difficulty: ${problem.difficulty}
Feasibility: ${problem.feasibility}` 
      }
    ], 600)

    // Strip markdown fences if Groq wraps in ```json
    const cleaned = raw.replace(/^```json\n?/,'').replace(/\n?```$/,'').trim()

    try {
      const parsed = JSON.parse(cleaned)
      return new Response(
        JSON.stringify(parsed), 
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    } catch {
      return new Response(
        JSON.stringify({ 
          ai_score: 60, 
          rejection_reason: null, 
          cleaned_title: problem.title, 
          cleaned_description: problem.description, 
          quality_notes: 'Auto-validated' 
        }), 
        { headers: { ...cors, 'Content-Type': 'application/json' } }
      )
    }

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), 
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})