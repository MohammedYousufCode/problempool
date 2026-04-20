import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, Zap, ArrowLeft, User, Star, Lock, Cpu, Download } from 'lucide-react'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import ProblemCard from '../components/ProblemCard'
import SkeletonCard from '../components/SkeletonCard'
import type { Problem } from '../types'
import { CREDIT_COSTS } from '../types'

// Public fields only — never includes description or who_faces_it
interface PublicProblem {
  id: string
  title: string
  domain_id: string
  domain?: { id: string; name: string; icon: string; color: string; slug: string; description: string; created_at: string }
  difficulty: string
  feasibility: string
  ai_score: number
  submitted_by: string | null
  is_approved: boolean
  created_at: string
  relatables?: { count: number }[]
  submitter?: { full_name: string | null; avatar_url: string | null } | null
}

// Gated fields — only fetched after server confirms unlock
interface GatedContent {
  description: string
  who_faces_it: string
}

export default function ProblemDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, credits, refreshCredits } = useAuth()
  const { toast } = useToast()

  const [problem, setProblem] = useState<PublicProblem | null>(null)
  const [gated, setGated] = useState<GatedContent | null>(null)
  const [related, setRelated] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [relatable, setRelatable] = useState(false)
  const [relatableCount, setRelatableCount] = useState(0)
  const [relatableLoading, setRelatableLoading] = useState(false)

  const [isUnlocked, setIsUnlocked] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  const [aiBuildVisible, setAiBuildVisible] = useState(false)
  const [aiBuildContent, setAiBuildContent] = useState('')
  const [aiBuildLoading, setAiBuildLoading] = useState(false)
  const [aiBuildUsed, setAiBuildUsed] = useState(false)

  const fetchGatedContent = async (problemId: string) => {
    const { data } = await supabase
      .from('unlocked_problem_content')
      .select('description, who_faces_it')
      .eq('id', problemId)
      .maybeSingle()
    if (data) setGated(data as GatedContent)
  }

  useEffect(() => {
    if (!id) return
    const load = async () => {
      // Reset all stale state before loading new problem
      setLoading(true)
      setIsUnlocked(false)
      setGated(null)
      setAiBuildVisible(false)
      setAiBuildContent('')
      setAiBuildUsed(false)
      setRelatable(false)
      setRelatableCount(0)
      setProblem(null)
      setRelated([])

      // Fetch public fields + submitter name
      const { data: p } = await supabase
  .from('problems')
  .select(`
    id, title, domain_id, domain:domains(*),
    difficulty, feasibility, ai_score,
    submitted_by, is_approved, created_at,
    relatables(count)
  `)
  .eq('id', id)
  .eq('is_approved', true)
  .single()

if (!p) { setLoading(false); return }
setRelatableCount(p.relatables?.[0]?.count ?? 0)
let submitterName: string | null = null
if (p.submitted_by) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', p.submitted_by)
    .maybeSingle()
  submitterName = profile?.full_name ?? null
}

      if (user) {
        const [{ data: unlocked }, { data: rel }] = await Promise.all([
          supabase.from('unlocked_problems').select('problem_id').eq('user_id', user.id).eq('problem_id', id).maybeSingle(),
          supabase.from('relatables').select('id').eq('user_id', user.id).eq('problem_id', id).maybeSingle(),
        ])
        const alreadyUnlocked = !!unlocked
        setIsUnlocked(alreadyUnlocked)
        setRelatable(!!rel)

        if (alreadyUnlocked) await fetchGatedContent(id)

        const { data: tx } = await supabase
          .from('credit_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('reason', `AI Build Panel: ${id}`)
          .maybeSingle()
        setAiBuildUsed(!!tx)
      }

      setProblem({ ...p, submitter: { full_name: submitterName, avatar_url: null } } as unknown as PublicProblem)

      supabase
        .from('problems')
        .select('*, domain:domains(*), relatables(count)')
        .eq('domain_id', p.domain_id)
        .eq('is_approved', true)
        .neq('id', id)
        .limit(3)
        .then(({ data: rel }) => { if (rel) setRelated(rel as unknown as Problem[]) })

      setLoading(false)
    }
    load()
  }, [id, user])

  const handleRelatable = async () => {
    if (!user || !problem) { toast('info', 'Sign in to mark problems as relatable'); return }
    setRelatableLoading(true)
    if (relatable) {
      await supabase.from('relatables').delete().eq('user_id', user.id).eq('problem_id', problem.id)
      setRelatable(false)
      setRelatableCount(c => c - 1)
    } else {
      await supabase.from('relatables').insert({ user_id: user.id, problem_id: problem.id })
      setRelatable(true)
      setRelatableCount(c => c + 1)
    }
    setRelatableLoading(false)
  }

  const handleUnlock = async () => {
    if (!user || !problem) return
    if (credits < CREDIT_COSTS.UNLOCK_PROBLEM) { toast('error', `Need ${CREDIT_COSTS.UNLOCK_PROBLEM} credits to unlock.`); return }
    setUnlocking(true)
    const { data, error } = await callEdgeFunction<{ success: boolean; already_unlocked?: boolean }>(
      'unlock-problem',
      { action: 'unlock', problem_id: problem.id }
    )
    if (error) {
      toast('error', error)
    } else if (data?.success) {
      await refreshCredits()
      setIsUnlocked(true)
      await fetchGatedContent(problem.id)
      toast('success', 'Problem unlocked!')
    }
    setUnlocking(false)
  }

  const handleAIBuild = async () => {
    if (!user || !problem || !gated) return
    if (!aiBuildUsed && credits < CREDIT_COSTS.AI_BUILD_PANEL) {
      toast('error', `Need ${CREDIT_COSTS.AI_BUILD_PANEL} credits for AI Build Panel.`)
      return
    }
    if (aiBuildVisible) { setAiBuildVisible(false); return }

    setAiBuildLoading(true)
    const { data, error } = await callEdgeFunction<{ success: boolean; content: string; credits_deducted?: boolean }>(
      'unlock-problem',
      {
        action: 'ai_build',
        problem_id: problem.id,
        problem: { title: problem.title, description: gated.description, who_faces_it: gated.who_faces_it },
      }
    )
    if (error) {
      toast('error', error)
    } else if (data?.success) {
      if (data.credits_deducted) await refreshCredits()
      setAiBuildUsed(true)
      setAiBuildContent(data.content ?? '')
      setAiBuildVisible(true)
    }
    setAiBuildLoading(false)
  }

  if (loading) return (
    <div className="page-enter container" style={{ padding: '3rem 0' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '2rem', width: '60%', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '1.5rem', width: '5rem', borderRadius: '9999px' }} />)}
        </div>
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '0.5rem' }} />)}
      </div>
    </div>
  )

  if (!problem) return (
    <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
      <h2>Problem not found</h2>
      <Link to="/problems" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Problems</Link>
    </div>
  )

  const locked = !isUnlocked && !!user
  const notLoggedIn = !user

  return (
    <div className="page-enter" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) 0' }}>
      <div className="container" style={{ maxWidth: 860 }}>
        <Link to="/problems" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>
          <ArrowLeft size={15} /> Back to Problems
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div className="card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                {problem.domain && <span className="badge badge-primary">{problem.domain.icon} {problem.domain.name}</span>}
                <span className={`badge badge-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
                <span className="badge badge-neutral"><Star size={10} /> {problem.ai_score}/100</span>
                <span className="badge badge-neutral">Feasibility: {problem.feasibility}</span>
              </div>
              <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{problem.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                <User size={13} />
                <span>Submitted by {problem.submitter?.full_name ?? 'Anonymous'}</span>
                <span>·</span>
                <span>{new Date(problem.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="divider" />

            <div style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Who Faces This</h2>
              {gated ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.7 }}>
                  {gated.who_faces_it}
                </p>
              ) : (
                <div style={{ height: '3rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={14} style={{ color: 'var(--color-text-faint)', marginRight: '0.4rem' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>Unlock to reveal</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Problem Description</h2>
              {gated ? (
                <div className="watermark-container">
                  {user && (
                    <div className="watermark">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="watermark-text" style={{ top: `${i * 18 - 20}%` }}>
                          {user.email} · ProblemPool &nbsp;&nbsp;&nbsp; {user.email} · ProblemPool &nbsp;&nbsp;&nbsp; {user.email} · ProblemPool
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.75, position: 'relative', zIndex: 2 }}>
                    {gated.description}
                  </p>
                </div>
              ) : (
                <div style={{ height: '6rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={14} style={{ color: 'var(--color-text-faint)', marginRight: '0.4rem' }} />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>Unlock to reveal</span>
                </div>
              )}
            </div>

            {(locked || notLoggedIn) && (
              <div style={{ padding: '1.25rem', background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem', textAlign: 'center' }}>
                <Lock size={24} style={{ color: 'var(--color-primary)', margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>
                  {notLoggedIn ? 'Sign in and unlock to see the full problem details.' : 'Unlock to see full description, who faces it, and get the AI build plan.'}
                </p>
                {notLoggedIn
                  ? <Link to="/auth" className="btn btn-primary">Sign in to unlock</Link>
                  : (
                    <button onClick={handleUnlock} disabled={unlocking} className="btn btn-primary">
                      {unlocking ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Lock size={14} />}
                      Unlock for {CREDIT_COSTS.UNLOCK_PROBLEM} credits
                    </button>
                  )
                }
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={handleRelatable} disabled={relatableLoading} className={`btn ${relatable ? 'btn-primary' : 'btn-secondary'}`}>
                <Heart size={15} fill={relatable ? 'currentColor' : 'none'} />
                Relatable ({relatableCount})
              </button>

              {isUnlocked && (
                <button onClick={handleAIBuild} disabled={aiBuildLoading} className="btn btn-secondary">
                  {aiBuildLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Cpu size={14} />}
                  {aiBuildUsed ? 'View Build Plan' : `AI Build Plan — ${CREDIT_COSTS.AI_BUILD_PANEL} credits`}
                </button>
              )}
            </div>
          </div>

          {aiBuildVisible && aiBuildContent && (
            <div className="card page-enter" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', borderTop: '3px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Cpu size={18} style={{ color: 'var(--color-primary)' }} />
                <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>AI Build Plan</h2>
                <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>Powered by Llama 3.3</span>
                <button
                  onClick={() => {
                    const win = window.open('', '_blank')
                    if (!win) return
                    const html = aiBuildContent
                      .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1rem;font-weight:700;margin:1.5rem 0 0.5rem;border-bottom:1px solid #e5e7eb;padding-bottom:4px">$1</h2>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/^\* (.+)$/gm, '<li style="margin:4px 0">$1</li>')
                      .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:4px 0"><strong>$1.</strong> $2</li>')
                      .replace(/\n\n/g, '</p><p style="margin:0.5rem 0">')
                      .replace(/\n/g, '<br/>')
                    win.document.write(`<!DOCTYPE html><html><head><title>Build Plan — ${problem?.title ?? ''}</title><style>body{font-family:system-ui,sans-serif;max-width:740px;margin:2rem auto;padding:0 1rem;color:#111;line-height:1.7}h2{color:#2563eb}li{margin-left:1.2rem}@media print{body{margin:1rem}}</style></head><body><h1 style="font-size:1.4rem;font-weight:800;margin-bottom:0.25rem">${problem?.title ?? 'Build Plan'}</h1><p style="color:#6b7280;margin-bottom:1.5rem;font-size:0.85rem">Generated by ProblemPool AI · problempool.tech</p><p style="margin:0">${html}</p><script>window.onload=()=>window.print()<\/script></body></html>`)
                    win.document.close()
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.35rem 0.75rem', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)', marginLeft: '0.5rem' }}
                >
                  <Download size={13} /> Export PDF
                </button>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.8 }}>
                {aiBuildContent.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return (
                    <h3 key={i} style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: '1.25rem 0 0.5rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.25rem' }}>
                      {line.replace('## ', '')}
                    </h3>
                  )
                  if (line.startsWith('* ') || line.startsWith('- ')) return (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', margin: '0.2rem 0', paddingLeft: '0.5rem' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700, flexShrink: 0 }}>·</span>
                      <span dangerouslySetInnerHTML={{ __html: line.replace(/^\* |^- /, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  )
                  if (/^\d+\. /.test(line)) return (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', margin: '0.2rem 0', paddingLeft: '0.5rem' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 700, flexShrink: 0, minWidth: '1.2rem' }}>{line.match(/^\d+/)?.[0]}.</span>
                      <span dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\. /, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  )
                  if (line.trim() === '') return <div key={i} style={{ height: '0.5rem' }} />
                  return (
                    <p key={i} style={{ margin: '0.2rem 0' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                  )
                })}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div>
              <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '1rem' }}>Related Problems</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '0.875rem' }}>
                {related.map(r => <ProblemCard key={r.id} problem={r} />)}
              </div>
            </div>
          )}
          {related.length === 0 && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '0.875rem' }}>
              {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
