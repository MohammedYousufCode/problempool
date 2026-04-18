import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Filter, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'
import ProblemCard from '../components/ProblemCard'
import SkeletonCard from '../components/SkeletonCard'
import type { Problem, Domain, Difficulty } from '../types'
import { CREDIT_COSTS } from '../types'

export default function Problems() {
  const { user, credits, refreshCredits } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [problems, setProblems] = useState<Problem[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [unlocking, setUnlocking] = useState<string | null>(null)

  const domainFilter = searchParams.get('domain') || ''
  const difficultyFilter = (searchParams.get('difficulty') || '') as Difficulty | ''
  const searchQ = searchParams.get('q') || ''

  const fetchProblems = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('problems')
      .select('*, domain:domains(*), relatables(count)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (domainFilter) {
      const dom = domains.find(d => d.slug === domainFilter)
      if (dom) query = query.eq('domain_id', dom.id)
    }
    if (difficultyFilter) query = query.eq('difficulty', difficultyFilter)
    if (searchQ) query = query.ilike('title', `%${searchQ}%`)

    const { data } = await query

    if (!data) { setLoading(false); return }

    // If user is logged in, check which problems they've unlocked
    let unlockedIds = new Set<string>()
    if (user) {
      const { data: unlocked } = await supabase
        .from('unlocked_problems')
        .select('problem_id')
        .eq('user_id', user.id)
      unlockedIds = new Set(unlocked?.map(u => u.problem_id) ?? [])
    }

    setProblems(data.map((p: Problem & { relatables: { count: number }[] }) => ({
      ...p,
      relatable_count: p.relatables?.[0]?.count ?? 0,
      is_unlocked: unlockedIds.has(p.id),
    })))
    setLoading(false)
  }, [user, domainFilter, difficultyFilter, searchQ, domains])

  useEffect(() => {
    supabase.from('domains').select('*').order('name').then(({ data }) => { if (data) setDomains(data) })
  }, [])

  useEffect(() => {
    if (domains.length > 0 || !domainFilter) fetchProblems()
  }, [fetchProblems, domains.length, domainFilter])

  const handleUnlock = async (problemId: string) => {
    if (!user) return
    if (credits < CREDIT_COSTS.UNLOCK_PROBLEM) {
      toast('error', `Not enough credits. You need ${CREDIT_COSTS.UNLOCK_PROBLEM} credits.`)
      return
    }
    setUnlocking(problemId)
    try {
      // Deduct credits
      const { error: creditErr } = await supabase.rpc('deduct_credits', {
        p_user_id: user.id,
        p_amount: CREDIT_COSTS.UNLOCK_PROBLEM,
        p_reason: `Unlocked problem ${problemId}`,
      })
      if (creditErr) throw creditErr

      // Insert unlock record
      await supabase.from('unlocked_problems').insert({ user_id: user.id, problem_id: problemId })

      await refreshCredits()
      setProblems(prev => prev.map(p => p.id === problemId ? { ...p, is_unlocked: true } : p))
      toast('success', 'Problem unlocked! Full details are now visible.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Failed to unlock problem')
    } finally {
      setUnlocking(null)
    }
  }

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    setSearchParams(params)
  }

  const clearFilters = () => setSearchParams({})
  const hasFilters = domainFilter || difficultyFilter || searchQ

  return (
    <div className="page-enter" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Problem Library</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {loading ? 'Loading...' : `${problems.length} AI-validated problems`}
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
            <input
              type="search" className="input" style={{ paddingLeft: '2.25rem', paddingRight: searchQ ? '2.25rem' : undefined }}
              placeholder="Search problems…"
              value={searchQ}
              onChange={e => setFilter('q', e.target.value)}
            />
            {searchQ && (
              <button onClick={() => setFilter('q', '')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex' }} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Domain filter */}
          <select className="input select" style={{ flex: '0 0 auto', width: 'auto', minWidth: 140 }} value={domainFilter} onChange={e => setFilter('domain', e.target.value)}>
            <option value="">All Domains</option>
            {domains.map(d => <option key={d.id} value={d.slug}>{d.icon} {d.name}</option>)}
          </select>

          {/* Difficulty filter */}
          <select className="input select" style={{ flex: '0 0 auto', width: 'auto', minWidth: 130 }} value={difficultyFilter} onChange={e => setFilter('difficulty', e.target.value)}>
            <option value="">All Difficulties</option>
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
            {domainFilter && <span className="badge badge-primary">{domainFilter} <button onClick={() => setFilter('domain', '')} style={{ marginLeft: '0.25rem', color: 'inherit', display: 'flex' }}><X size={10} /></button></span>}
            {difficultyFilter && <span className={`badge badge-${difficultyFilter.toLowerCase()}`}>{difficultyFilter} <button onClick={() => setFilter('difficulty', '')} style={{ marginLeft: '0.25rem', color: 'inherit', display: 'flex' }}><X size={10} /></button></span>}
            {searchQ && <span className="badge badge-neutral">"{searchQ}" <button onClick={() => setFilter('q', '')} style={{ marginLeft: '0.25rem', color: 'inherit', display: 'flex' }}><X size={10} /></button></span>}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '1rem' }}>
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : problems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
            <Filter size={40} style={{ margin: '0 auto 1rem', color: 'var(--color-text-faint)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>No problems found</h3>
            <p style={{ fontSize: 'var(--text-sm)', marginBottom: '1rem' }}>Try adjusting your filters or {' '}
              <button onClick={clearFilters} style={{ color: 'var(--color-primary)', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}>clear all filters</button>
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '1rem' }}>
            {problems.map(p => (
              <ProblemCard key={p.id} problem={p} onUnlock={handleUnlock} unlocking={unlocking === p.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}