import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// No CORS headers — this function is never called from a browser.
// It is only callable with the CRON_SECRET header (set in Supabase secrets).

serve(async (req) => {
  // Fix 1: Authenticate the caller — only allow requests with the cron secret
  // Set CRON_SECRET in Supabase secrets to any long random string you choose
  const cronSecret = Deno.env.get('CRON_SECRET')
  const incoming  = req.headers.get('x-cron-secret')
  if (!cronSecret || incoming !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const RESEND = Deno.env.get('RESEND_API_KEY')!

  const { data: users } = await supabase
    .from('user_credits')
    .select('user_id')
    .eq('digest_opt_in', true)

  if (!users?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: problems } = await supabase
    .from('problems')
    .select('*, domain:domains(name, icon)')
    .eq('is_approved', true)
    .gte('created_at', weekAgo)
    .order('ai_score', { ascending: false })
    .limit(5)

  if (!problems?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: 'No new problems' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userIds = users.map(u => u.user_id)
  const emailList: string[] = []
  for (const uid of userIds) {
    const { data: { user } } = await supabase.auth.admin.getUserById(uid)
    if (user?.email) emailList.push(user.email)
  }

  // Fix 2: HTML-escape problem titles before injecting into email
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const problemsHtml = problems.map((p: {
    title: string; domain?: { icon: string; name: string };
    difficulty: string; ai_score: number; id: string
  }) => `
    <div style="padding:1rem;border:1px solid #e2e4e9;border-radius:8px;margin-bottom:0.75rem;">
      <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.375rem;">
        <span style="background:rgba(14,165,233,0.1);color:#0ea5e9;padding:0.15rem 0.5rem;border-radius:9999px;font-size:0.75rem;font-weight:600;">
          ${escape(p.domain?.icon ?? '')} ${escape(p.domain?.name ?? 'General')}
        </span>
        <span style="font-size:0.75rem;color:#6b7280;">AI Score: ${p.ai_score}/100</span>
      </div>
      <h3 style="font-size:0.9375rem;font-weight:700;color:#111827;margin:0 0 0.375rem;">${escape(p.title)}</h3>
      <a href="https://problempool.tech/problems/${escape(p.id)}" style="font-size:0.8125rem;color:#0ea5e9;text-decoration:none;font-weight:600;">View Problem →</a>
    </div>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f8f9fb;font-family:Inter,-apple-system,sans-serif;"><div style="max-width:560px;margin:2rem auto;background:#fff;border-radius:12px;border:1px solid #e2e4e9;overflow:hidden;"><div style="background:#0ea5e9;padding:1.5rem;text-align:center;color:#fff;"><strong style="font-size:1.1rem;">📬 Your Weekly Problem Digest</strong></div><div style="padding:1.5rem 2rem;"><p style="color:#6b7280;margin:0 0 1.25rem;font-size:0.9375rem;line-height:1.7;">Here are the top new problems added to ProblemPool this week:</p>${problemsHtml}<a href="https://problempool.tech/problems" style="display:block;text-align:center;background:#0ea5e9;color:#fff;text-decoration:none;padding:0.875rem;border-radius:8px;font-weight:700;margin-top:0.5rem;">Browse All Problems →</a></div><div style="padding:1rem 2rem;border-top:1px solid #e2e4e9;text-align:center;font-size:0.75rem;color:#9ca3af;">You're receiving this because you opted in to weekly digests. <a href="https://problempool.tech/profile" style="color:#0ea5e9;">Unsubscribe</a></div></div></body></html>`

  let sent = 0
  for (const email of emailList) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ProblemPool <noreply@mail.problempool.tech>',
        to: [email],
        subject: `🔥 ${problems.length} new problems this week on ProblemPool`,
        html,
      }),
    })
    sent++
    await new Promise(r => setTimeout(r, 100))
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
