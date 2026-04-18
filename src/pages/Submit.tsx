import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, CheckCircle, AlertTriangle, Send } from 'lucide-react'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import type { Domain, Difficulty, Feasibility } from '../types'

interface ValidateResult {
  cleaned_title?: string
  cleaned_description?: string
  ai_score: number
  rejection_reason?: string
  is_duplicate?: boolean
  duplicate_id?: string
}

export default function Submit() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [domains, setDomains] = useState<Domain[]>([])
  const [form, setForm] = useState({ title: '', domain_id: '', who_faces_it: '', description: '', difficulty: 'Medium' as Difficulty, feasibility: 'Medium' as Feasibility })
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validated, setValidated] = useState<ValidateResult | null>(null)
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form')

  useEffect(() => {
    supabase.from('domains').select('*').order('name').then(({ data }) => { if (data) setDomains(data) })
  }, [])

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.domain_id || !form.description || !form.who_faces_it) {
      toast('error', 'Please fill in all required fields')
      return
    }
    setValidating(true)
    const { data, error } = await callEdgeFunction<ValidateResult>('validate-problem', {
      mode: 'validate',
      problem: form,
    })
    setValidating(false)
    if (error) { toast('error', error); return }
    if (!data) { toast('error', 'Validation failed'); return }
    setValidated(data)
    setStep('preview')
  }

  const handleSave = async () => {
    if (!user || !validated) return
    setSaving(true)
    const { error } = await supabase.from('problems').insert({
      title: validated.cleaned_title ?? form.title,
      description: validated.cleaned_description ?? form.description,
      domain_id: form.domain_id,
      who_faces_it: form.who_faces_it,
      difficulty: form.difficulty,
      feasibility: form.feasibility,
      ai_score: validated.ai_score,
      submitted_by: user.id,
      is_approved: false,
    })
    setSaving(false)
    if (error) { toast('error', error.message); return }
    setStep('done')
  }

  if (step === 'done') return (
    <div style={{ minHeight: 'calc(100dvh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="page-enter card" style={{ padding: '2.5rem', textAlign: 'center', maxWidth: 480, width: '100%' }}>
        <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '0.5rem' }}>Problem Submitted!</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Your problem is pending admin review. You'll earn <strong>+5 credits</strong> once approved.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setStep('form'); setForm({ title: '', domain_id: '', who_faces_it: '', description: '', difficulty: 'Medium', feasibility: 'Medium' }); setValidated(null) }} className="btn btn-secondary">Submit Another</button>
          <button onClick={() => navigate('/profile')} className="btn btn-primary">View Profile</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-enter" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) 0' }}>
      <div className="container-narrow">
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Submit a Problem</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>AI validates quality, detects duplicates, and rewrites vague descriptions.</p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.75rem' }}>
          {[{ label: 'Write Problem', key: 'form' }, { label: 'AI Preview', key: 'preview' }].map((s, i) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {i > 0 && <div style={{ width: 32, height: 1, background: 'var(--color-border)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: step === s.key ? 'var(--color-primary)' : 'var(--color-surface-2)', color: step === s.key ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, transition: 'all var(--transition-base)' }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: step === s.key ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {step === 'form' && (
          <form onSubmit={handleValidate} className="card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="label" htmlFor="title">Problem Title *</label>
              <input id="title" className="input" required maxLength={120} placeholder="A clear, specific title" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="domain">Domain *</label>
              <select id="domain" className="input select" required value={form.domain_id} onChange={e => set('domain_id', e.target.value)}>
                <option value="">Select a domain…</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.icon} {d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="who">Who Faces This Problem? *</label>
              <input id="who" className="input" required placeholder="e.g., Small shop owners in Tier 2 cities" value={form.who_faces_it} onChange={e => set('who_faces_it', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="desc">Problem Description *</label>
              <textarea id="desc" className="input textarea" required minLength={80} placeholder="Describe the problem in detail. What pain point exists? What's the current workaround? Why does it matter?" value={form.description} onChange={e => set('description', e.target.value)} style={{ minHeight: 130 }} />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: '0.375rem' }}>{form.description.length}/80 min chars</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label" htmlFor="diff">Difficulty</label>
                <select id="diff" className="input select" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                  {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="feas">Feasibility</label>
                <select id="feas" className="input select" value={form.feasibility} onChange={e => set('feasibility', e.target.value)}>
                  {['Low', 'Medium', 'High'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={validating} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {validating ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Validating with AI…</> : <><Zap size={15} /> Validate with AI</>}
            </button>
          </form>
        )}

        {step === 'preview' && validated && (
          <div className="page-enter card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {validated.rejection_reason ? (
              <div style={{ display: 'flex', gap: '0.75rem', padding: '1.25rem', background: 'var(--color-error-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(220,38,38,0.2)' }}>
                <AlertTriangle size={20} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: '0.375rem', color: 'var(--color-error)' }}>Problem Rejected</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{validated.rejection_reason}</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                  <CheckCircle size={18} />
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Looks good! Review the AI-cleaned version:</span>
                  <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>AI Score: {validated.ai_score}/100</span>
                </div>
                <div>
                  <p className="label">Title</p>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                    {validated.cleaned_title ?? form.title}
                  </p>
                </div>
                <div>
                  <p className="label">Description (AI-enhanced)</p>
                  <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.75, color: 'var(--color-text)', padding: '0.875rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap' }}>
                    {validated.cleaned_description ?? form.description}
                  </p>
                </div>
                {validated.is_duplicate && (
                  <div style={{ padding: '0.875rem', background: 'var(--color-warning-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                    ⚠️ A similar problem may already exist. Proceeding will submit as a new variant.
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep('form')} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>← Edit</button>
              {!validated.rejection_reason && (
                <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
                  Submit Problem
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}