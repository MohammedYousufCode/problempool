import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const { mode, problem } = await req.json()
  const GROQ = Deno.env.get('GROQ_API_KEY')!

  const groq = async (messages: { role: string; content: string }[], maxTokens = 800) => {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'meta-llama/llama-4-scout-17b-16e-instruct', messages, max_tokens: maxTokens, temperature: 0.7 }),
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
Week 2: ...
Week 3: ...
Week 4: Launch prep + deployment

Keep it practical for a solo developer.`
    }], 900)
    return new Response(JSON.stringify({ content }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  // mode === 'validate'
  const raw = await groq([
    { role: 'system', content: 'You are a problem statement quality reviewer. Respond ONLY with valid JSON, no markdown fences.' },
    { role: 'user', content: `Review this problem statement. Return a JSON object with these exact keys:
- ai_score: integer 0-100 (quality/specificity/real-world relevance)
- rejection_reason: string (if score < 25 or spam/offensive, explain why) or null
- cleaned_title: improved specific title string
- cleaned_description: rewritten structured description (keep meaning, improve clarity)
- quality_notes: one-line feedback string

Title: ${problem.title}
Who faces it: ${problem.who_faces_it}
Description: ${problem.description}
Difficulty: ${problem.difficulty}
Feasibility: ${problem.feasibility}

Score 90+ only for highly specific, real, validated pain points. Score below 25 and reject generic, spam, or nonsensical submissions.` }
  ], 600)

  try {
    const parsed = JSON.parse(raw)
    return new Response(JSON.stringify(parsed), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ ai_score: 50, rejection_reason: null, cleaned_title: problem.title, cleaned_description: problem.description, quality_notes: 'Parsed with fallback' }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})