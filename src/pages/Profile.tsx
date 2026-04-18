import { useEffect, useState } from 'react'
import { Zap, Package, Lock, Heart, Bell, BellOff } from 'lucide-react'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import type { Problem, CreditTransaction } from '../types'
import { CREDIT_PACKS } from '../types'

declare global { interface Window { Razorpay: new (opts: RazorpayOptions) => { open(): void }; } }
interface RazorpayOptions { key: string; amount: number; currency: string; name: string; description: string; order_id: string; handler: (resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void; modal?: { ondismiss?: () => void }; prefill?: { email?: string; name?: string }; theme?: { color?: string } }

export default function Profile() {
  const { user, credits, refreshCredits } = useAuth()
  const { toast } = useToast()
  const [submitted, setSubmitted] = useState<Problem[]>([])
  const [unlocked, setUnlocked] = useState<Problem[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [digestOpt, setDigestOpt] = useState(false)
  const [digestLoading, setDigestLoading] = useState(false)
  const [payLoading, setPayLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'submitted' | 'unlocked' | 'credits'>('submitted')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('problems').select('*, domain:domains(*)').eq('submitted_by', user.id).order('created_at', { ascending: false }),
      supabase.from('unlocked_problems').select('*, problem:problems(*, domain:domains(*))').eq('user_id', user.id).order('unlocked_at', { ascending: false }).limit(20),
      supabase.from('credit_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('user_credits').select('digest_opt_in').eq('user_id', user.id).single(),
    ]).then(([{ data: s }, { data: u }, { data: t }, { data: opts }]) => {
      if (s) setSubmitted(s as unknown as Problem[])
      if (u) setUnlocked(u.map((r: unknown) => (r as { problem: Problem }).problem).filter(Boolean))
      if (t) setTransactions(t)
      if (opts) setDigestOpt(opts.digest_opt_in)
    })
  }, [user])

  const handleDigestToggle = async () => {
    if (!user) return
    setDigestLoading(true)
    const newVal = !digestOpt
    await supabase.from('user_credits').update({ digest_opt_in: newVal }).eq('user_id', user.id)
    setDigestOpt(newVal)
    toast('success', newVal ? 'Weekly digest enabled!' : 'Digest disabled.')
    setDigestLoading(false)
  }

  const handleBuyCredits = async (packId: string) => {
  const pack = CREDIT_PACKS.find(p => p.id === packId)
  if (!pack || !user) return
  setPayLoading(packId)

  try {
    // 1. Create order
    const { data, error } = await callEdgeFunction<{ order_id: string; amount: number }>(
      'razorpay-create-order',
      { pack_id: packId, user_id: user.id }
    )

    if (error || !data?.order_id) {
      toast('error', error ?? 'Failed to create payment order')
      setPayLoading(null)
      return
    }

    // 2. Load Razorpay script
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load Razorpay'))
        document.head.appendChild(script)
      })
    }

    // 3. Open checkout
    const rzp = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.amount,
      currency: 'INR',
      name: 'ProblemPool',
      description: `${pack.name} — ${pack.credits} credits`,
      order_id: data.order_id,
      handler: async (resp) => {
        // ✅ Call verify-payment, NOT razorpay-webhook
        const { error: verifyErr } = await callEdgeFunction('verify-payment', {
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_signature: resp.razorpay_signature,
          user_id: user.id,
          pack_id: packId,
        })

        if (verifyErr) {
          toast('error', `Payment done but credits failed: contact support with ID ${resp.razorpay_payment_id}`)
        } else {
          await refreshCredits()
          toast('success', `🎉 ${pack.credits} credits added!`)
        }
      },
      modal: {
        ondismiss: () => {
          setPayLoading(null)
          toast('info', 'Payment cancelled.')
        },
      },
      prefill: { email: user.email },
      theme: { color: '#0ea5e9' },
    })

    rzp.open()

  } catch (err) {
    toast('error', err instanceof Error ? err.message : 'Payment error')
    setPayLoading(null)
  }
}

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  const diffStyle = (d: string) => ({ Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' }[d] ?? 'badge-neutral')
  const statusStyle = (approved: boolean) => approved ? 'badge-easy' : 'badge-neutral'

  return (
    <div className="page-enter" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) 0' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Profile header */}
        <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-primary)', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '0.2rem' }}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{user?.email}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>{credits}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', marginTop: '0.25rem' }}>
              <Zap size={12} fill="currentColor" style={{ color: 'var(--color-primary)' }} /> credits
            </div>
          </div>
          <div>
            <button onClick={handleDigestToggle} disabled={digestLoading} className={`btn ${digestOpt ? 'btn-primary' : 'btn-secondary'} btn-sm`}>
              {digestLoading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : digestOpt ? <Bell size={13} /> : <BellOff size={13} />}
              {digestOpt ? 'Digest ON' : 'Digest OFF'}
            </button>
          </div>
        </div>

        {/* Buy Credits */}
        <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={16} style={{ color: 'var(--color-primary)' }} /> Buy Credits
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '0.875rem' }}>
            {CREDIT_PACKS.map(pack => (
              <div key={pack.id} className="card" style={{ padding: '1.25rem', border: pack.popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', position: 'relative' }}>
                {pack.popular && <div style={{ position: 'absolute', top: -10, right: '0.75rem', background: 'var(--color-primary)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: '9999px' }}>POPULAR</div>}
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-primary)' }}>₹{pack.price}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{pack.credits} credits</div>
                <button onClick={() => handleBuyCredits(pack.id)} disabled={payLoading === pack.id} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  {payLoading === pack.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Zap size={12} />}
                  {pack.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
          {([['submitted', 'My Submissions', submitted.length], ['unlocked', 'Unlocked', unlocked.length], ['credits', 'Credit History', transactions.length]] as const).map(([tab, label, count]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}>
              {label}
              <span style={{ background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-2)', borderRadius: '9999px', padding: '0.1rem 0.45rem', fontSize: '0.65rem', fontWeight: 700 }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Submitted problems */}
        {activeTab === 'submitted' && (
          <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {submitted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                <Lock size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--color-text-faint)' }} />
                <p style={{ fontSize: 'var(--text-sm)' }}>You haven't submitted any problems yet.</p>
              </div>
            ) : submitted.map(p => (
              <div key={p.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {p.domain && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{p.domain.icon} {p.domain.name}</span>}
                    <span className={`badge ${diffStyle(p.difficulty)}`} style={{ fontSize: '0.65rem' }}>{p.difficulty}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <span className={`badge ${statusStyle(p.is_approved)}`} style={{ fontSize: '0.65rem' }}>
                    {p.is_approved ? '✓ Approved' : '⏳ Pending'}
                  </span>
                </div>
                <div style={{ flexShrink: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                  AI: {p.ai_score}/100
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unlocked problems */}
        {activeTab === 'unlocked' && (
          <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {unlocked.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                <Zap size={36} style={{ margin: '0 auto 0.75rem', color: 'var(--color-text-faint)' }} />
                <p style={{ fontSize: 'var(--text-sm)' }}>You haven't unlocked any problems yet.</p>
              </div>
            ) : unlocked.map(p => p && (
              <div key={p.id} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</p>
                  {p.domain && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{p.domain.icon} {p.domain.name}</span>}
                </div>
                <span className={`badge ${diffStyle(p.difficulty)}`} style={{ fontSize: '0.65rem' }}>{p.difficulty}</span>
              </div>
            ))}
          </div>
        )}

        {/* Credit history */}
        {activeTab === 'credits' && (
          <div className="page-enter card" style={{ overflow: 'hidden' }}>
            {transactions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No transactions yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Description', 'Amount', 'Date'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>{tx.reason}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: 'var(--text-xs)', fontWeight: 700, color: tx.amount > 0 ? 'var(--color-success)' : 'var(--color-error)', fontVariantNumeric: 'tabular-nums' }}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}