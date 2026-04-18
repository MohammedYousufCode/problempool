import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon, Zap, Menu, X, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'

export default function Navbar() {
  const { user, credits, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: '/problems', label: 'Browse' },
    { href: '/submit',   label: 'Submit' },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      backdropFilter: 'blur(12px)',
      height: 64,
    }}>
      <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text)', flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="ProblemPool logo">
            <rect width="32" height="32" rx="8" fill="#0ea5e9"/>
            <circle cx="16" cy="14" r="6" stroke="white" strokeWidth="2.5"/>
            <circle cx="16" cy="14" r="2" fill="white"/>
            <path d="M16 20v5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', letterSpacing: '-0.01em' }}>ProblemPool</span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '1rem', flex: 1 }} className="desktop-only">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: isActive(link.href) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: isActive(link.href) ? 'rgba(14,165,233,0.1)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
          {/* Credits chip */}
          {user && (
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.3rem 0.75rem',
                background: 'rgba(14,165,233,0.1)',
                border: '1px solid rgba(14,165,233,0.2)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: 'var(--color-primary)',
              }}>
                <Zap size={12} fill="currentColor" />
                {credits}
              </div>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost"
            style={{ padding: '0.4rem', borderRadius: 'var(--radius-md)' }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Auth actions — desktop */}
          <div className="desktop-only" style={{ display: 'flex', gap: '0.5rem' }}>
            {user ? (
              <>
                <Link to="/profile" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={15} />
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </Link>
                <button onClick={signOut} className="btn btn-ghost btn-sm" aria-label="Sign out">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <Link to="/auth" className="btn btn-primary btn-sm">Sign In</Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="mobile-only btn btn-ghost"
            style={{ padding: '0.4rem' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: 64, left: 0, right: 0,
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          {navLinks.map(link => (
            <Link key={link.href} to={link.href}
              onClick={() => setMobileOpen(false)}
              style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: 'var(--text-sm)', fontWeight: 500, color: isActive(link.href) ? 'var(--color-primary)' : 'var(--color-text)', background: isActive(link.href) ? 'rgba(14,165,233,0.1)' : 'transparent' }}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <User size={16} /> Profile
              </Link>
              <button onClick={() => { signOut(); setMobileOpen(false) }} className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="btn btn-primary">Sign In</Link>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .mobile-only { display: none !important; } }
        @media (max-width: 767px) { .desktop-only { display: none !important; } }
      `}</style>
    </nav>
  )
}