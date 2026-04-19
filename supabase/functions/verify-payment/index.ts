import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PACKS: Record<string, number> = { 
  basic: 100, 
  standard: 300, 
  pro: 700 
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, user_id, pack_id } = body

    // Log incoming data for debugging
    console.log('verify-payment called:', { razorpay_order_id, razorpay_payment_id, pack_id, user_id })

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !user_id || !pack_id) {
      console.error('Missing fields:', { razorpay_payment_id, razorpay_order_id, razorpay_signature, user_id, pack_id })
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { 
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' } 
      })
    }

    // Get secret
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET not set!')
      return new Response(JSON.stringify({ message: 'Server config error' }), { 
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' } 
      })
    }

    // Verify signature — Razorpay signs order_id|payment_id with KEY_SECRET
    const signatureBody = `${razorpay_order_id}|${razorpay_payment_id}`
    const key = await crypto.subtle.importKey(
      'raw', 
      new TextEncoder().encode(secret), 
      { name: 'HMAC', hash: 'SHA-256' }, 
      false, 
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureBody))
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('Signature check:', { computed: computed.slice(0,10) + '...', received: razorpay_signature.slice(0,10) + '...' })

    if (computed !== razorpay_signature) {
      console.error('Signature mismatch!')
      return new Response(JSON.stringify({ message: 'Invalid signature' }), { 
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' } 
      })
    }

    // Get credits for pack
    const credits = PACKS[pack_id]
    if (!credits) {
      console.error('Invalid pack_id:', pack_id)
      return new Response(JSON.stringify({ message: 'Invalid pack' }), { 
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' } 
      })
    }

    // Add credits to user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: rpcError } = await supabase.rpc('add_credits', {
      p_user_id: user_id,
      p_amount: credits,
      p_reason: `Purchased ${pack_id} pack (${razorpay_payment_id})`,
    })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      return new Response(JSON.stringify({ message: 'Failed to add credits', detail: rpcError.message }), { 
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' } 
      })
    }

    console.log(`✅ Added ${credits} credits to user ${user_id}`)
    return new Response(JSON.stringify({ success: true, credits_added: credits }), { 
      headers: { ...cors, 'Content-Type': 'application/json' } 
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), { 
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' } 
    })
  }
})