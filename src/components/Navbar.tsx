import { Link, useLocation } from 'react-router-dom'
import { Sun, Moon, Zap, LogOut, User, LayoutGrid, Send, Shield } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'

/* ── Admin emails — add yours here ───────────────────────── */
const ADMIN_EMAILS = [
  'mohammedyousuf8505@gmail.com',
  // add more admin emails as needed
]

/* ── Premium ProblemPool Logo ────────────────────────────── */
function PPLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="ProblemPool logo">
      {/* Rounded square base */}
      <rect width="32" height="32" rx="9" fill="#0ea5e9"/>
      {/* Outer ring — the "pool" */}
      <circle cx="16" cy="15" r="8" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none"/>
      {/* Middle ring */}
      <circle cx="16" cy="15" r="5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
      {/* Bullseye center */}
      <circle cx="16" cy="15" r="2.5" fill="white"/>
      {/* Drop tail — water drop + lightbulb idea */}
      <path d="M16 19.5 L16 23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13.5 23 L18.5 23" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function Navbar() {
  const { user, credits, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false
  const isLowCredits = credits < 20
  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/')

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''

  return (
    <>
      <nav
        className="navbar-glass"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          height: 'var(--navbar-height)',
        }}
      >
        <div className="container-wide" style={{ height: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link
            to="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              textDecoration: 'none', color: 'var(--color-text)', flexShrink: 0,
            }}
          >
            <PPLogo size={30} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, var(--color-text) 40%, var(--color-primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              ProblemPool
            </span>
          </Link>

          {/* ── Desktop nav links ─────────────────────────── */}
          <div
            className="desktop-only"
            style={{ display: 'flex', gap: '0.125rem', marginLeft: '1.25rem', flex: 1 }}
          >
            {[
              { href: '/problems', label: 'Browse' },
              { href: '/submit',   label: 'Submit' },
            ].map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={isActive(link.href) ? 'nav-link-active' : ''}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: isActive(link.href) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  background: isActive(link.href) ? 'rgba(14,165,233,0.08)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                  position: 'relative',
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Admin link — only visible to admins */}
            {isAdmin && (
              <Link
                to="/admin"
                className={isActive('/admin') ? 'nav-link-active' : ''}
                style={{
                  padding: '0.4rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: isActive('/admin') ? '#8b5cf6' : 'var(--color-text-muted)',
                  background: isActive('/admin') ? 'rgba(139,92,246,0.1)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  position: 'relative',
                }}
              >
                <Shield size={14} />
                Admin
              </Link>
            )}
          </div>

          {/* ── Right side actions ────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>

            {/* Admin badge (desktop) */}
            {isAdmin && (
              <span className="admin-badge desktop-only">
                <Shield size={9} />
                Admin
              </span>
            )}

            {/* Credits chip */}
            {user && (
              <Link to="/profile" style={{ textDecoration: 'none' }}>
                <div
                  className={isLowCredits ? 'credits-chip-low' : ''}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.3rem 0.75rem',
                    background: isLowCredits ? 'rgba(220,38,38,0.1)' : 'rgba(14,165,233,0.1)',
                    border: `1px solid ${isLowCredits ? 'rgba(220,38,38,0.25)' : 'rgba(14,165,233,0.2)'}`,
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    color: isLowCredits ? 'var(--color-error)' : 'var(--color-primary)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={11} fill="currentColor" />
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
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Desktop user actions */}
            <div className="desktop-only" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {/* Avatar circle with initials */}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </span>
                  </Link>
                  <button onClick={signOut} className="btn btn-ghost btn-sm" aria-label="Sign out">
                    <LogOut size={14} />
                  </button>
                </>
              ) : (
                <Link to="/auth" className="btn btn-primary btn-sm">Sign In</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation ───────────────────────────── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link
          to="/problems"
          className={`mobile-nav-item ${isActive('/problems') ? 'active' : ''}`}
        >
          <LayoutGrid size={22} />
          Browse
        </Link>

        <Link
          to="/submit"
          className={`mobile-nav-item ${isActive('/submit') ? 'active' : ''}`}
        >
          <Send size={22} />
          Submit
        </Link>

        <Link
          to="/profile"
          className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
        >
          {user ? (
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700, color: '#fff',
            }}>
              {displayName ? displayName.charAt(0).toUpperCase() : <User size={13} />}
            </div>
          ) : (
            <User size={22} />
          )}
          {user ? displayName.charAt(0).toUpperCase() + displayName.slice(1, 7) : 'Sign In'}
        </Link>

        {/* Admin shortcut on mobile */}
        {isAdmin && (
          <Link
            to="/admin"
            className={`mobile-nav-item ${isActive('/admin') ? 'active' : ''}`}
            style={{ color: isActive('/admin') ? '#8b5cf6' : undefined }}
          >
            <Shield size={22} />
            Admin
          </Link>
        )}
      </nav>
    </>
  )
}