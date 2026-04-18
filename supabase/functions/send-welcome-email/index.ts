import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const { email, name } = await req.json()
  const RESEND = Deno.env.get('RESEND_API_KEY')!
  const displayName = name || email?.split('@')[0] || 'there'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Welcome to ProblemPool</title></head>
<body style="margin:0;padding:0;background:#f8f9fb;font-family:Inter,-apple-system,sans-serif;">
  <div style="max-width:560px;margin:2rem auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e4e9;">
    <div style="background:#0ea5e9;padding:2rem;text-align:center;">
      <div style="display:inline-flex;align-items:center;gap:0.5rem;color:#fff;">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.2)"/><circle cx="16" cy="14" r="6" stroke="white" stroke-width="2.5"/><circle cx="16" cy="14" r="2" fill="white"/><path d="M16 20v5" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>
        <span style="font-size:1.25rem;font-weight:800;letter-spacing:-0.02em;">ProblemPool</span>
      </div>
    </div>
    <div style="padding:2rem 2.5rem;">
      <h1 style="font-size:1.5rem;font-weight:800;color:#111827;margin:0 0 0.5rem;">Welcome, ${displayName}! 🎉</h1>
      <p style="color:#6b7280;line-height:1.7;margin:0 0 1.5rem;">You've joined India's #1 problem statement platform. Your account comes loaded with <strong style="color:#0ea5e9;">50 free credits</strong> to get started.</p>
      <div style="background:#f8f9fb;border-radius:8px;padding:1.25rem;margin-bottom:1.5rem;">
        <h3 style="font-size:0.875rem;font-weight:700;color:#374151;margin:0 0 0.75rem;text-transform:uppercase;letter-spacing:0.05em;">What you can do with your credits</h3>
        ${[['🔓', 'Unlock full problem details', '10 credits each'], ['🤖', 'Get AI build plans', '15 credits each'], ['📝', 'Submit approved problems', 'Earn +5 credits']].map(([icon, text, cost]) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;border-bottom:1px solid #e2e4e9;font-size:0.875rem;"><span style="color:#374151;">${icon} ${text}</span><span style="color:#0ea5e9;font-weight:600;">${cost}</span></div>`).join('')}
      </div>
      <a href="https://problempool.tech/problems" style="display:block;text-align:center;background:#0ea5e9;color:#fff;text-decoration:none;padding:0.875rem;border-radius:8px;font-weight:700;font-size:1rem;">Browse Problems →</a>
    </div>
    <div style="padding:1rem 2.5rem 1.5rem;border-top:1px solid #e2e4e9;text-align:center;">
      <p style="font-size:0.75rem;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} ProblemPool · <a href="https://problempool.tech" style="color:#0ea5e9;text-decoration:none;">problempool.tech</a></p>
    </div>
  </div>
</body>
</html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'ProblemPool <noreply@mail.problempool.tech>',
      to: [email],
      subject: 'Welcome to ProblemPool — 50 free credits inside 🎉',
      html,
    }),
  })

  return new Response(JSON.stringify({ sent: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})