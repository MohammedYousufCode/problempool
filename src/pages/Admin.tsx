import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Send, Shield, Star } from 'lucide-react'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import type { Problem } from '../types'

export default function Admin() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const adminEmail = 'mohammedyousuf8505@gmail.com'

  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [digestLoading, setDigestLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.email !== adminEmail) { navigate('/'); return }
    fetchPending()
  }, [user, adminEmail, navigate])

  const fetchPending = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('problems')
      .select('*, domain:domains(*)')
      .eq('is_approved', false)
      .order('created_at', { ascending: false })
    if (data) setProblems(data as unknown as Problem[])
    setLoading(false)
  }

  const handleApprove = async (problem: Problem) => {
    setActionLoading(problem.id)
    const { error } = await supabase.from('problems').update({ is_approved: true }).eq('id', problem.id)
    if (error) { toast('error', error.message); setActionLoading(null); return }

    // Award +5 credits to submitter
    if (problem.submitted_by) {
      await supabase.rpc('add_credits', {
        p_user_id: problem.submitted_by,
        p_amount: 5,
        p_reason: `Problem approved: ${problem.title}`,
      })
    }

    setProblems(prev => prev.filter(p => p.id !== problem.id))
    toast('success', 'Problem approved! Submitter earned +5 credits.')
    setActionLoading(null)
  }

  const handleReject = async (problemId: string) => {
    if (!confirm('Reject and delete this problem? This cannot be undone.')) return
    setActionLoading(problemId)
    await supabase.from('problems').delete().eq('id', problemId)
    setProblems(prev => prev.filter(p => p.id !== problemId))
    toast('info', 'Problem rejected and deleted.')
    setActionLoading(null)
  }

  const handleDigest = async () => {
    setDigestLoading(true)
    const { error } = await callEdgeFunction('send-weekly-digest', {})
    if (error) toast('error', error)
    else toast('success', 'Weekly digest sent to all opted-in users!')
    setDigestLoading(false)
  }

  if (!user || user.email !== adminEmail) return null

  return (
    <div className="page-enter" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) 0' }}>
      <div className="container">
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.875rem', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Shield size={18} style={{ color: 'var(--color-primary)' }} />
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em' }}>Admin Panel</h1>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {loading ? 'Loading…' : `${problems.length} pending review`}
            </p>
          </div>
          <button onClick={handleDigest} disabled={digestLoading} className="btn btn-secondary">
            {digestLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
            Send Weekly Digest
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : problems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
            <CheckCircle size={40} style={{ margin: '0 auto 1rem', color: 'var(--color-success)' }} />
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>All clear!</p>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: '0.5rem' }}>No problems pending review.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Title', 'Domain', 'Submitted By', 'AI Score', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {problems.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-divider)', transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '1rem', maxWidth: 280 }}>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '40ch' }}>{p.description}</p>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {p.domain && <span className="badge badge-primary" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{p.domain.icon} {p.domain.name}</span>}
                    </td>
                    <td style={{ padding: '1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {p.submitted_by ? p.submitted_by.slice(0, 8) + '…' : 'Anonymous'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}><Star size={10} /> {p.ai_score}/100</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleApprove(p)} disabled={actionLoading === p.id} className="btn btn-sm" style={{ background: 'var(--color-success-subtle)', color: 'var(--color-success)', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          {actionLoading === p.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <CheckCircle size={13} />}
                          Approve
                        </button>
                        <button onClick={() => handleReject(p.id)} disabled={actionLoading === p.id} className="btn btn-sm btn-danger">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}