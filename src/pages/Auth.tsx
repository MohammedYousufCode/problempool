import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

/* ── Premium ProblemPool Logo (same as Navbar) ─────────── */
function PPLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="ProblemPool logo">
      <rect width="32" height="32" rx="9" fill="rgba(255,255,255,0.2)"/>
      <circle cx="16" cy="15" r="8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
      <circle cx="16" cy="15" r="5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none"/>
      <circle cx="16" cy="15" r="2.5" fill="white"/>
      <path d="M16 19.5 L16 23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M13.5 23 L18.5 23" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

/* ── Real Google Logo SVG ──────────────────────────────── */
function GoogleLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function Auth() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/problems', { replace: true })
  }, [user, navigate])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth` },
        })
        if (error) throw error
        toast('info', 'Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast('success', 'Welcome back!')
        navigate('/problems')
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${import.meta.env.VITE_APP_URL}/auth` },
    })
    if (error) { toast('error', error.message); setGoogleLoading(false) }
  }

  return (
    <div style={{
      minHeight: 'calc(100dvh - var(--navbar-height))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'var(--color-bg)',
    }}>
      <div className="page-enter" style={{
        width: '100%', maxWidth: 880,
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr)',
      }}>
        {/* Split layout wrapper */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
        }}
          className="auth-card-grid"
        >
          {/* ── Left: Brand panel (desktop only) ──────── */}
          <div
            className="auth-split-left desktop-only"
            style={{ minHeight: 480 }}
          >
            {/* Floating decorative shapes */}
            <div className="auth-floating-shape" style={{ width: 120, height: 120, top: '10%', left: '-15%', animationDelay: '0s' }} />
            <div className="auth-floating-shape" style={{ width: 80, height: 80, bottom: '15%', right: '-10%', animationDelay: '2s' }} />
            <div className="auth-floating-shape" style={{ width: 50, height: 50, top: '55%', left: '10%', animationDelay: '4s' }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: '#fff' }}>
              <PPLogo size={56} />
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 800,
                marginTop: '1.25rem',
                marginBottom: '0.75rem',
                letterSpacing: '-0.03em',
              }}>
                ProblemPool
              </h2>
              <p style={{ opacity: 0.85, fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '26ch', margin: '0 auto' }}>
                India's #1 platform for real problem statements. Find, validate, and build.
              </p>

              {/* Feature bullets */}
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left' }}>
                {[
                  '🎯 AI-validated problem statements',
                  '⚡ 50 free credits on signup',
                  '🚀 Get AI build plans instantly',
                  '🇮🇳 Built for Indian founders',
                ].map((feat) => (
                  <div key={feat} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}>
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Form panel ─────────────────────── */}
          <div style={{
            background: 'var(--color-surface)',
            padding: 'clamp(2rem, 5vw, 3rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            {/* Mobile logo */}
            <div className="mobile-only" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <svg width="40" height="40" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 0.5rem' }}>
                <rect width="32" height="32" rx="9" fill="#0ea5e9"/>
                <circle cx="16" cy="15" r="8" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
                <circle cx="16" cy="15" r="5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none"/>
                <circle cx="16" cy="15" r="2.5" fill="white"/>
                <path d="M16 19.5 L16 23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M13.5 23 L18.5 23" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                marginBottom: '0.3rem',
              }}>
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {mode === 'signup'
                  ? 'Get 50 free credits on signup — no card needed'
                  : 'Sign in to access your problems and credits'}
              </p>
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '1.25rem', justifyContent: 'center', gap: '0.75rem', padding: '0.7rem 1rem' }}
            >
              {googleLoading ? <span className="spinner" /> : <GoogleLogo />}
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="divider" style={{ flex: 1, margin: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', whiteSpace: 'nowrap' }}>
                or with email
              </span>
              <div className="divider" style={{ flex: 1, margin: 0 }} />
            </div>

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
                  <input
                    id="email" type="email" required className="input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    className="input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                    placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-faint)', padding: '0.25rem',
                    }}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.25rem' }}
              >
                {loading ? <span className="spinner" /> : null}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
                style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
              >
                {mode === 'signin' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .auth-card-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}