import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const RESEND = Deno.env.get('RESEND_API_KEY')!

  // Get opted-in users
  const { data: users } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('digest_opt_in', true)

  if (!users?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...cors, 'Content-Type': 'application/json' } })

  // Get top 5 new problems this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: problems } = await supabase
    .from('problems')
    .select('*, domain:domains(name, icon)')
    .eq('is_approved', true)
    .gte('created_at', weekAgo)
    .order('ai_score', { ascending: false })
    .limit(5)

  if (!problems?.length) return new Response(JSON.stringify({ sent: 0, reason: 'No new problems' }), { headers: { ...cors, 'Content-Type': 'application/json' } })

  // Get user emails via admin API
  const userIds = users.map(u => u.user_id)
  const emailList: string[] = []
  for (const uid of userIds) {
    const { data: { user } } = await supabase.auth.admin.getUserById(uid)
    if (user?.email) emailList.push(user.email)
  }

  const problemsHtml = problems.map((p: { title: string; domain?: { icon: string; name: string }; difficulty: string; ai_score: number; id: string }) => `
    <div style="padding:1rem;border:1px solid #e2e4e9;border-radius:8px;margin-bottom:0.75rem;">
      <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.375rem;">
        <span style="background:rgba(14,165,233,0.1);color:#0ea5e9;padding:0.15rem 0.5rem;border-radius:9999px;font-size:0.75rem;font-weight:600;">${p.domain?.icon ?? ''} ${p.domain?.name ?? 'General'}</span>
        <span style="font-size:0.75rem;color:#6b7280;">AI Score: ${p.ai_score}/100</span>
      </div>
      <h3 style="font-size:0.9375rem;font-weight:700;color:#111827;margin:0 0 0.375rem;">${p.title}</h3>
      <a href="https://problempool.tech/problems/${p.id}" style="font-size:0.8125rem;color:#0ea5e9;text-decoration:none;font-weight:600;">View Problem →</a>
    </div>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f8f9fb;font-family:Inter,-apple-system,sans-serif;"><div style="max-width:560px;margin:2rem auto;background:#fff;border-radius:12px;border:1px solid #e2e4e9;overflow:hidden;"><div style="background:#0ea5e9;padding:1.5rem;text-align:center;color:#fff;"><strong style="font-size:1.1rem;">📬 Your Weekly Problem Digest</strong></div><div style="padding:1.5rem 2rem;"><p style="color:#6b7280;margin:0 0 1.25rem;font-size:0.9375rem;line-height:1.7;">Here are the top new problems added to ProblemPool this week:</p>${problemsHtml}<a href="https://problempool.tech/problems" style="display:block;text-align:center;background:#0ea5e9;color:#fff;text-decoration:none;padding:0.875rem;border-radius:8px;font-weight:700;margin-top:0.5rem;">Browse All Problems →</a></div><div style="padding:1rem 2rem;border-top:1px solid #e2e4e9;text-align:center;font-size:0.75rem;color:#9ca3af;">You're receiving this because you opted in to weekly digests. <a href="https://problempool.tech/profile" style="color:#0ea5e9;">Unsubscribe</a></div></div></body></html>`

  // Send in batches to avoid rate limits
  let sent = 0
  for (const email of emailList) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'ProblemPool <noreply@mail.problempool.tech>', to: [email], subject: `🔥 ${problems.length} new problems this week on ProblemPool`, html }),
    })
    sent++
    await new Promise(r => setTimeout(r, 100)) // 100ms rate limit buffer
  }

  return new Response(JSON.stringify({ sent }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})