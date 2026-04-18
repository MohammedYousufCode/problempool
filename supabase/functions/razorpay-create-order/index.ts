import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PACKS: Record<string, { credits: number; amount: number }> = {
  basic:    { credits: 100, amount: 4900  },
  standard: { credits: 300, amount: 9900  },
  pro:      { credits: 700, amount: 19900 },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const { pack_id } = await req.json()
  const pack = PACKS[pack_id]
  if (!pack) return new Response(JSON.stringify({ message: 'Invalid pack' }), { status: 400, headers: cors })

  const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!
  const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!
  const credentials = btoa(`${KEY_ID}:${KEY_SECRET}`)

  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: pack.amount, currency: 'INR', receipt: `pp_${pack_id}_${Date.now()}` }),
  })

  const order = await r.json()
  if (!r.ok) return new Response(JSON.stringify({ message: order.error?.description ?? 'Order creation failed' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })

  return new Response(JSON.stringify({ order_id: order.id, amount: order.amount }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})