import { Link } from 'react-router-dom'
import type { Domain } from '../types'

export default function DomainCard({ domain }: { domain: Domain }) {
  return (
    <Link
      to={`/problems?domain=${domain.slug}`}
      className="card card-interactive"
      style={{ padding: '1.25rem', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}
    >
      <div style={{ fontSize: '1.75rem', lineHeight: 1 }}>{domain.icon}</div>
      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)' }}>{domain.name}</h3>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{domain.description}</p>
      {domain.problem_count !== undefined && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, marginTop: 'auto' }}>
          {domain.problem_count} problems
        </span>
      )}
    </Link>
  )
}