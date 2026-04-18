import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PACKS: Record<string, number> = { basic: 100, standard: 300, pro: 700 }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, user_id, pack_id } = await req.json()

  // Verify signature
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!
  const body = `${razorpay_order_id}|${razorpay_payment_id}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (computed !== razorpay_signature) {
    return new Response(JSON.stringify({ message: 'Invalid signature' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
  }

  const credits = PACKS[pack_id]
  if (!credits) return new Response(JSON.stringify({ message: 'Invalid pack' }), { status: 400, headers: cors })

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Add credits
  await supabase.rpc('add_credits', {
    p_user_id: user_id,
    p_amount: credits,
    p_reason: `Purchased ${pack_id} pack (${razorpay_payment_id})`,
  })

  return new Response(JSON.stringify({ success: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})