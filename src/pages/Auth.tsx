import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

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
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth` } })
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
    <div style={{ minHeight: 'calc(100dvh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="page-enter" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#0ea5e9"/>
                <circle cx="16" cy="14" r="6" stroke="white" strokeWidth="2.5"/>
                <circle cx="16" cy="14" r="2" fill="white"/>
                <path d="M16 20v5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '0.25rem' }}>
              {mode === 'signin' ? 'Welcome back' : 'Join ProblemPool'}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {mode === 'signup' ? 'Get 50 free credits on signup' : 'Sign in to your account'}
            </p>
          </div>

          {/* Google OAuth */}
          <button onClick={handleGoogle} disabled={googleLoading} className="btn btn-secondary" style={{ width: '100%', marginBottom: '1.25rem', justifyContent: 'center' }}>
            {googleLoading ? <span className="spinner" /> : <Chrome size={16} />}
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', whiteSpace: 'nowrap' }}>or continue with email</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
                <input id="email" type="email" required className="input" style={{ paddingLeft: '2.5rem' }}
                  placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', pointerEvents: 'none' }} />
                <input id="password" type={showPass ? 'text' : 'password'} required className="input" style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : 'Your password'}
                  minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)', display: 'flex', alignItems: 'center' }} aria-label="Toggle password visibility">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '1.25rem' }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
              style={{ color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontSize: 'inherit' }}>
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
        <p style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: '1rem' }}>
          By continuing, you agree to our{' '}
          <Link to="/" style={{ color: 'var(--color-primary)' }}>Terms</Link> &{' '}
          <Link to="/" style={{ color: 'var(--color-primary)' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}