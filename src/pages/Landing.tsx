import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Zap, Search, Globe, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import DomainCard from '../components/DomainCard'
import type { Domain, Problem } from '../types'
import { CREDIT_PACKS } from '../types'

/* ── Domain image mapping ──────────────────────────────── */
const DOMAIN_IMAGES: Record<string, string> = {
  agritech:     'photo-1625246333195-78d9c38ad449',
  cleantech:    'photo-1466611653911-95081537e5b7',
  edtech:       'photo-1524178232363-1fb2b075b655',
  fintech:      'photo-1579621970563-ebec7560ff3e',
  govtech:      'photo-1529107386315-e1a2ed48a620',
  healthtech:   'photo-1559757148-5c350d0d3c56',
  logistics:    'photo-1586528116311-ad8dd3c8310d',
  retailtech:   'photo-1441986300917-64674bd600d8',
  socialimpact: 'photo-1531206715517-5c0ba140b2b8',
}

const PACK_ICONS: Record<string, string> = {
  basic:    '⚡',
  standard: '🚀',
  pro:      '💎',
}

/* ── Social proof avatars ──────────────────────────────── */
const PROOF_NAMES = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram']

export default function Landing() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [ticker, setTicker] = useState<Problem[]>([])

  useEffect(() => {
    supabase
      .from('domains')
      .select('*, problems(count)')
      .order('name')
      .then(({ data }) => {
        if (data) {
          setDomains(data.map((d: Domain & { problems: { count: number }[] }) => ({
            ...d,
            problem_count: d.problems?.[0]?.count ?? 0,
          })))
        }
      })

    supabase
      .from('problems')
      .select('id, title, difficulty, domain:domains(name, icon)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setTicker(data as unknown as Problem[]) })
  }, [])

  const steps = [
    {
      icon: <Search size={22} />,
      title: 'Browse Real Problems',
      desc: 'Explore verified problem statements across 9 domains, each scored by AI for quality and feasibility.',
    },
    {
      icon: <Zap size={22} />,
      title: 'Unlock & Validate',
      desc: 'Use credits to unlock full problem details. AI scores tell you which problems are worth solving.',
    },
    {
      icon: <Globe size={22} />,
      title: 'Build & Launch',
      desc: 'Get AI-generated build plans with tech stacks, timelines, and MVP roadmaps to start shipping.',
    },
  ]

  return (
    <div className="page-enter">

      {/* ── Ticker ──────────────────────────────────────── */}
      {ticker.length > 0 && (
        <div style={{
          background: 'rgba(14,165,233,0.05)',
          borderBottom: '1px solid rgba(14,165,233,0.1)',
          padding: '0.55rem 0',
          overflow: 'hidden',
        }}>
          <div className="ticker-inner">
            {[...ticker, ...ticker].map((p, i) => (
              <span key={`${p.id}-${i}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0 2rem',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ color: 'var(--color-primary)', fontSize: '0.5rem' }}>●</span>
                {(p as unknown as { domain: { icon: string } }).domain?.icon} {p.title}
                <span className={`badge badge-${p.difficulty?.toLowerCase()}`} style={{ fontSize: '0.63rem', padding: '0.1rem 0.4rem' }}>
                  {p.difficulty}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Dot grid + glow layers */}
        <div className="hero-dot-grid" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div className="hero-glow" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

        <div style={{
          position: 'relative', zIndex: 2,
          padding: 'clamp(4.5rem, 10vw, 7rem) 0 clamp(3.5rem, 8vw, 5.5rem)',
          textAlign: 'center',
        }}>
          <div className="container-narrow">
            {/* Badge */}
            <div className="fade-up" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 1rem',
              background: 'rgba(14,165,233,0.1)',
              border: '1px solid rgba(14,165,233,0.25)',
              borderRadius: '9999px',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              color: 'var(--color-primary)',
              marginBottom: '1.5rem',
              letterSpacing: '0.02em',
            }}>
              <Zap size={11} fill="currentColor" />
              India's #1 Problem Statement Platform
            </div>

            {/* Heading */}
            <h1
              className="fade-up fade-up-delay-1"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-hero)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                marginBottom: '1.25rem',
                color: 'var(--color-text)',
              }}
            >
              Find Real Problems.<br />
              <span style={{ color: 'var(--color-primary)' }}>Build Real Solutions.</span>
            </h1>

            {/* Subheading */}
            <p
              className="fade-up fade-up-delay-2"
              style={{
                fontSize: 'var(--text-lg)',
                color: 'var(--color-text-muted)',
                maxWidth: '52ch',
                margin: '0 auto 2.25rem',
                lineHeight: 1.65,
              }}
            >
              Discover AI-validated problem statements from real users across India.
              Submit, validate, and build products people actually need.
            </p>

            {/* CTAs */}
            <div
              className="fade-up fade-up-delay-3"
              style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}
            >
              <Link to="/problems" className="btn btn-primary btn-lg">
                Browse Problems <ArrowRight size={18} />
              </Link>
              <Link to="/auth" className="btn btn-secondary btn-lg">
  Get 100 Free Credits
</Link>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
              Free to join · 100 credits on signup · No subscription
            </p>

            {/* ── Social proof ─────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.875rem', marginTop: '2rem',
              padding: '0.875rem 1.5rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              width: 'fit-content',
              margin: '2rem auto 0',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Avatar stack */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {PROOF_NAMES.map((name, i) => (
                  <img
                    key={name}
                    src={`https://ui-avatars.com/api/?name=${name}&size=32&background=random&color=fff&bold=true`}
                    alt={name}
                    loading="lazy"
                    width={32} height={32}
                    style={{
                      borderRadius: '50%',
                      border: '2px solid var(--color-surface)',
                      marginLeft: i === 0 ? 0 : -8,
                      width: 32, height: 32,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
    <TrendingUp size={13} style={{ color: 'var(--color-success)' }} />
    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text)' }}>
      90+ problems submitted by real users
    </span>
  </div>
  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
    across 9 Indian market domains
  </span>
</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Domains ─────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="container-wide">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: '0.5rem',
            }}>
              Explore by Domain
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Problems from every sector of the Indian market
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
            gap: '1rem',
          }}>
            {domains.length === 0
              ? Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="card" style={{ padding: '1.25rem', height: 160 }}>
                    <div className="skeleton" style={{ height: '1.75rem', width: '2rem', marginBottom: '0.5rem', borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton" style={{ height: '1rem', width: '70%', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ height: '0.875rem', width: '90%' }} />
                  </div>
                ))
              : domains.map((d, i) => (
                  <DomainCard
                    key={d.id}
                    domain={d}
                    imageId={DOMAIN_IMAGES[d.slug] || DOMAIN_IMAGES[d.name?.toLowerCase()] || undefined}
                    className={`stagger-${Math.min(i + 1, 4)}`}
                  />
                ))
            }
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: '0.5rem',
            }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              From problem to product in 3 steps
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '1.5rem' }}>
            {steps.map((step, i) => (
              <div
                key={i}
                className="card card-interactive"
                style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: 'rgba(14,165,233,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-primary)', flexShrink: 0,
                  }}>
                    {step.icon}
                  </div>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    color: 'var(--color-text-faint)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    Step {i + 1}
                  </span>
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-base)', fontWeight: 700,
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.65 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)', fontWeight: 800,
              letterSpacing: '-0.02em', marginBottom: '0.5rem',
            }}>
              Credit Packs
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              One-time purchase. No subscriptions. Ever.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
            gap: '1.25rem',
            maxWidth: 860, margin: '0 auto',
          }}>
            {CREDIT_PACKS.map(pack => (
              <div
                key={pack.id}
                className={`card ${pack.popular ? 'card-glow' : 'card-interactive'}`}
                style={{
                  padding: '1.875rem',
                  position: 'relative',
                  border: pack.popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  transition: 'all var(--transition-base)',
                }}
              >
                {pack.popular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(90deg, var(--color-primary), #38bdf8)',
                    color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                    padding: '0.22rem 0.875rem',
                    borderRadius: '9999px', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(14,165,233,0.35)',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                {/* Pack icon + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{PACK_ICONS[pack.id]}</span>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-base)', fontWeight: 700,
                  }}>
                    {pack.name}
                  </h3>
                </div>

                <div style={{
                  fontSize: 'var(--text-xl)', fontWeight: 800,
                  color: 'var(--color-primary)',
                  letterSpacing: '-0.02em',
                  fontFamily: 'var(--font-display)',
                }}>
                  ₹{pack.price}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                  {pack.credits} credits
                </div>

                {[
                  `${Math.floor(pack.credits / 10)} problem unlocks`,
                  `${Math.floor(pack.credits / 15)} AI build plans`,
                  'Never expires',
                ].map(feat => (
                  <div key={feat} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
                    marginBottom: '0.45rem',
                  }}>
                    <CheckCircle size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    {feat}
                  </div>
                ))}

                <Link
                  to="/auth"
                  className={`btn ${pack.popular ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}