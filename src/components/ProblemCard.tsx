import { Link } from 'react-router-dom'
import { Lock, Star, Heart, Unlock } from 'lucide-react'
import type { Problem } from '../types'
import { useAuth } from '../lib/auth'

interface ProblemCardProps {
  problem: Problem
  onUnlock?: (id: string) => void
  unlocking?: boolean
}

export default function ProblemCard({ problem, onUnlock, unlocking }: ProblemCardProps) {
  const { user } = useAuth()
  const isLocked = user && !problem.is_unlocked
  const notLoggedIn = !user

  return (
    <article className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <Link to={`/problems/${problem.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.4, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text)')}
          >
            {problem.title}
          </h3>
        </Link>
        {(isLocked || notLoggedIn) ? <Lock size={14} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} /> : <Unlock size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}>
        {problem.domain && (
          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
            {problem.domain.icon} {problem.domain.name}
          </span>
        )}
        <span className={`badge badge-${problem.difficulty.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
          {problem.difficulty}
        </span>
        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
          <Star size={10} /> {problem.ai_score}/100
        </span>
        {problem.relatable_count !== undefined && problem.relatable_count > 0 && (
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            <Heart size={10} /> {problem.relatable_count}
          </span>
        )}
      </div>

      {/* Description with blur */}
      <div className="watermark-container" style={{ flex: 1 }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}
          className={isLocked || notLoggedIn ? 'blur-lock' : ''}>
          {problem.description}
        </p>
      </div>

      {/* Unlock CTA */}
      {isLocked && onUnlock && (
        <button
          onClick={() => onUnlock(problem.id)}
          disabled={unlocking}
          className="btn btn-primary btn-sm"
          style={{ width: '100%', marginTop: '0.25rem' }}
        >
          {unlocking ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Unlock size={14} />}
          Unlock — 10 credits
        </button>
      )}
      {notLoggedIn && (
        <Link to="/auth" className="btn btn-secondary btn-sm" style={{ textAlign: 'center', marginTop: '0.25rem' }}>
          <Lock size={14} /> Sign in to unlock
        </Link>
      )}
    </article>
  )
}