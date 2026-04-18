import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      padding: '2rem 0',
      marginTop: '4rem',
    }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#0ea5e9"/>
            <circle cx="16" cy="14" r="6" stroke="white" strokeWidth="2.5"/>
            <circle cx="16" cy="14" r="2" fill="white"/>
            <path d="M16 20v5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>ProblemPool</span>
          <span style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-xs)' }}>© {new Date().getFullYear()}</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[
            { href: '/problems', label: 'Browse' },
            { href: '/submit',   label: 'Submit' },
            { href: '/auth',     label: 'Sign In' },
          ].map(l => (
            <Link key={l.href} to={l.href} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 'var(--text-sm)', transition: 'color var(--transition-fast)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >{l.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  )
}