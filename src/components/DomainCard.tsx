import { Link } from 'react-router-dom'
import type { Domain } from '../types'

interface DomainCardProps {
  domain: Domain
  imageId?: string
  className?: string
}

export default function DomainCard({ domain, imageId, className = '' }: DomainCardProps) {
  const hasImage = Boolean(imageId)

  if (hasImage) {
    return (
      <Link
        to={`/problems?domain=${domain.slug}`}
        className={`domain-card-img-wrap ${className}`}
        style={{
          display: 'block',
          position: 'relative',
          height: 160,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          textDecoration: 'none',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        }}
      >
        <img
          src={`https://images.unsplash.com/${imageId}?w=400&q=75&auto=format`}
          alt={domain.name}
          loading="lazy"
          className="domain-card-img"
        />
        <div className="domain-card-overlay" />

        {/* Content over image */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          padding: '1rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.375rem', lineHeight: 1, marginBottom: '0.3rem' }}>
                {domain.icon}
              </div>
              <h3 style={{
                color: '#fff', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: '0.9rem',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}>
                {domain.name}
              </h3>
            </div>
            {domain.problem_count !== undefined && (
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '0.65rem', fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '9999px',
                letterSpacing: '0.02em',
              }}>
                {domain.problem_count} problems
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  /* Fallback: text card (no image) */
  return (
    <Link
      to={`/problems?domain=${domain.slug}`}
      className={`card card-interactive ${className}`}
      style={{
        padding: '1.25rem',
        textDecoration: 'none',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        minHeight: 140,
      }}
    >
      <div style={{ fontSize: '1.75rem', lineHeight: 1 }}>{domain.icon}</div>
      <div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-sm)', fontWeight: 700,
          marginBottom: '0.2rem', color: 'var(--color-text)',
        }}>
          {domain.name}
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {domain.description}
        </p>
      </div>
      {domain.problem_count !== undefined && (
        <span style={{ marginTop: 'auto', fontSize: '0.68rem', color: 'var(--color-text-faint)', fontWeight: 600 }}>
          {domain.problem_count} problems
        </span>
      )}
    </Link>
  )
}