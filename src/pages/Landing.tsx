import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, Zap, Search, Globe, TrendingUp } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { supabase } from '../lib/supabase'
import DomainCard from '../components/DomainCard'
import type { Domain, Problem } from '../types'
import { CREDIT_PACKS } from '../types'

/* Register GSAP plugins */
gsap.registerPlugin(ScrollTrigger)

/* Domain image mapping (untouched) */
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

/* Hard-coded dark palette — isolated from theme system */
const C = {
  bg:       '#0a0a0a',
  surface:  '#111111',
  teal:     '#00BFA6',
  tealGlow: 'rgba(0,191,166,0.35)',
  tealDim:  'rgba(0,191,166,0.12)',
  gold:     '#F5C842',
  goldDim:  'rgba(245,200,66,0.10)',
  text:     '#ffffff',
  muted:    'rgba(255,255,255,0.55)',
  faint:    'rgba(255,255,255,0.22)',
}

/* Three story cards for Act 2 */
const STORY_CARDS = [
  { domain: 'Fintech',  icon: '💳', title: 'Micro-lending gap for unbanked rural households',     color: '#00BFA6' },
  { domain: 'EduTech',  icon: '📚', title: 'Dropout rate spikes after Class 8 in tier-3 towns',   color: '#F5C842' },
  { domain: 'GovTech',  icon: '🏛️', title: 'Pension disbursement delays in last-mile villages',    color: '#a78bfa' },
]

const PROOF_NAMES = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram']

export default function Landing() {
  /* ── Data hooks (untouched logic) ──────────────────── */
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

  /* ── GSAP refs ──────────────────────────────────────── */
  const wrapperRef     = useRef<HTMLDivElement>(null)

  // Act 1
  const act1HeadRef    = useRef<HTMLHeadingElement>(null)
  const act1SubRef     = useRef<HTMLParagraphElement>(null)
  const glowRef        = useRef<HTMLDivElement>(null)

  // Act 2
  const act2LabelRef   = useRef<HTMLDivElement>(null)
  const card0Ref       = useRef<HTMLDivElement>(null)
  const card1Ref       = useRef<HTMLDivElement>(null)
  const card2Ref       = useRef<HTMLDivElement>(null)

  // Act 3
  const act3HeadRef    = useRef<HTMLHeadingElement>(null)
  const logoMarkRef    = useRef<HTMLDivElement>(null)
  const ctaBtnRef      = useRef<HTMLAnchorElement>(null)
  const radialGlowRef  = useRef<HTMLDivElement>(null)

  /* ── GSAP ScrollTrigger timeline ────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth < 768
      const cardRefs = [card0Ref, card1Ref, card2Ref]

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      })

      /* ── Act 1: 0% → 30% ─── */
      tl.fromTo(glowRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.12, ease: 'power2.out' }, 0)
      tl.fromTo(act1HeadRef.current,
        { opacity: 0, y: isMobile ? 24 : 40 },
        { opacity: 1, y: 0, duration: 0.14, ease: 'power3.out' }, 0.02)
      tl.fromTo(act1SubRef.current,
        { opacity: 0, y: isMobile ? 16 : 24 },
        { opacity: 1, y: 0, duration: 0.10, ease: 'power3.out' }, 0.06)
      // Fade out at 25%
      tl.to([act1HeadRef.current, act1SubRef.current, glowRef.current],
        { opacity: 0, y: isMobile ? -20 : -36, duration: 0.08, ease: 'power2.in' }, 0.22)

      /* ── Act 2: 30% → 70% ─── */
      tl.fromTo(act2LabelRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.08, ease: 'power3.out' }, 0.30)
      cardRefs.forEach((ref, i) => {
        tl.fromTo(ref.current,
          { opacity: 0, y: isMobile ? 60 : 100, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.12, ease: 'power3.out' },
          0.33 + i * 0.10)
      })
      // Fade out at 62%
      tl.to([act2LabelRef.current, card0Ref.current, card1Ref.current, card2Ref.current],
        { opacity: 0, y: isMobile ? -30 : -60, scale: 0.95, duration: 0.08, ease: 'power2.in' }, 0.62)

      /* ── Act 3: 70% → 100% ─── */
      tl.fromTo(radialGlowRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.10, ease: 'power2.out' }, 0.70)
      tl.fromTo(act3HeadRef.current,
        { opacity: 0, y: isMobile ? 24 : 40 },
        { opacity: 1, y: 0, duration: 0.12, ease: 'power3.out' }, 0.72)
      tl.fromTo(logoMarkRef.current,
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.10, ease: 'back.out(1.5)' }, 0.80)
      tl.fromTo(ctaBtnRef.current,
        { opacity: 0, y: 20, scale: 0.93 },
        { opacity: 1, y: 0, scale: 1, duration: 0.12, ease: 'back.out(1.4)' }, 0.86)
    }, wrapperRef)

    return () => ctx.revert()
  }, [])

  /* ── How it works steps ─────────────────────────────── */
  const steps = [
    { icon: <Search size={22} />, title: 'Browse Real Problems', desc: 'Explore verified problem statements across 9 domains, each scored by AI for quality and feasibility.' },
    { icon: <Zap size={22} />,    title: 'Unlock & Validate',    desc: 'Use credits to unlock full problem details. AI scores tell you which problems are worth solving.' },
    { icon: <Globe size={22} />,  title: 'Build & Launch',       desc: 'Get AI-generated build plans with tech stacks, timelines, and MVP roadmaps to start shipping.' },
  ]

  /* ────────────────────────────────────────────────────── */
  return (
    <div className="page-enter">

      {/* Keyframe definitions */}
      <style>{`
        @keyframes pp-glow-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.9;  transform: scale(1.1); }
        }
        @keyframes pp-btn-pulse {
          0%, 100% { box-shadow: 0 0 32px rgba(0,191,166,0.35), 0 4px 16px rgba(0,191,166,0.25); }
          50%       { box-shadow: 0 0 56px rgba(0,191,166,0.55), 0 8px 28px rgba(0,191,166,0.35); }
        }
        @keyframes pp-gold-sweep {
          0%   { left: -110%; opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { left: 110%;  opacity: 0; }
        }
        @keyframes pp-scroll-bounce {
          0%, 100% { opacity: 0.45; transform: translateX(-50%) translateY(0); }
          50%       { opacity: 0.9;  transform: translateX(-50%) translateY(7px); }
        }
        @keyframes pp-ticker-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .pp-ticker-track { animation: pp-ticker-scroll 44s linear infinite; }
        .pp-ticker-wrap:hover .pp-ticker-track { animation-play-state: paused; }
      `}</style>

      {/* ════════════════════════════════════════════════
          CINEMATIC SCROLLYTELLING HERO
          Mobile: 300vh  |  Desktop: 500vh
      ════════════════════════════════════════════════ */}
      <div
        ref={wrapperRef}
        style={{ height: 'clamp(300vh, 500vh, 500vh)', position: 'relative' }}
      >
        {/* Sticky viewport */}
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          overflow: 'hidden', background: C.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>

          {/* Grid lines */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }} />

          {/* Radial gold glow — Act 3 */}
          <div ref={radialGlowRef} aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 1, opacity: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse 65% 55% at 50% 58%, ${C.goldDim} 0%, transparent 68%)`,
          }} />

          {/* ───── ACT 1: The Problem ───────────────────── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '0 1.5rem',
          }}>
            {/* Teal pulsing glow orb */}
            <div ref={glowRef} aria-hidden style={{
              position: 'absolute', opacity: 0,
              width: 'min(520px, 88vw)', height: 'min(300px, 48vw)',
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(0,191,166,0.32) 0%, transparent 70%)`,
              filter: 'blur(52px)',
              animation: 'pp-glow-pulse 3.8s ease-in-out infinite',
            }} />
            <h2 ref={act1HeadRef} style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(1.5rem, 5.5vw, 3.5rem)',
              fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.12,
              color: C.text, opacity: 0,
              marginBottom: '1rem', maxWidth: '18ch', zIndex: 1,
            }}>
              Every builder faces<br />the same question.
            </h2>
            <p ref={act1SubRef} style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(1.05rem, 2.8vw, 1.6rem)',
              color: C.muted, opacity: 0, zIndex: 1,
              letterSpacing: '0.005em',
            }}>
              <span style={{ color: C.teal, fontWeight: 700 }}>"</span>
              What should I build?
              <span style={{ color: C.teal, fontWeight: 700 }}>"</span>
            </p>
          </div>

          {/* ───── ACT 2: The Solution ──────────────────── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '0 1.25rem', gap: 'clamp(0.75rem, 1.8vw, 1rem)',
          }}>
            {/* Vertical label on the left — hidden on very small screens */}
            <div ref={act2LabelRef} style={{
              position: 'absolute',
              left: 'clamp(0.75rem, 4vw, 3.5rem)',
              top: '50%',
              transform: 'translateY(-50%) rotate(-90deg)',
              transformOrigin: 'center center',
              opacity: 0, whiteSpace: 'nowrap',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(0.55rem, 1vw, 0.68rem)',
              fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: C.teal,
            }}>
              100+ real problems · 9 domains · AI-validated
            </div>

            {/* Domain cards */}
            {STORY_CARDS.map((card, i) => {
              const ref = [card0Ref, card1Ref, card2Ref][i]
              return (
                <div key={card.domain} ref={ref} style={{
                  width: '100%', maxWidth: 'min(500px, calc(100vw - 2.5rem))',
                  background: C.surface,
                  border: `1px solid ${card.color}40`,
                  borderRadius: 14,
                  padding: 'clamp(0.875rem, 2.5vw, 1.25rem) clamp(1rem, 3vw, 1.5rem)',
                  opacity: 0,
                  boxShadow: `0 0 36px ${card.color}1A, 0 0 0 1px ${card.color}22`,
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  pointerEvents: 'none',
                  zIndex: 3 - i,
                }}>
                  <span style={{ fontSize: 'clamp(1.2rem, 2.8vw, 1.5rem)', flexShrink: 0 }}>
                    {card.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: 'clamp(0.58rem, 1.2vw, 0.64rem)',
                      fontWeight: 800, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: card.color,
                      marginBottom: '0.3rem',
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {card.domain}
                    </span>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 'clamp(0.875rem, 1.8vw, 1rem)',
                      fontWeight: 600, color: C.text,
                      lineHeight: 1.35, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {card.title}
                    </p>
                  </div>
                  <div style={{
                    width: 3, height: 'clamp(28px, 4.5vw, 36px)',
                    background: card.color, borderRadius: 9999,
                    flexShrink: 0, opacity: 0.75,
                    boxShadow: `0 0 10px ${card.color}`,
                  }} />
                </div>
              )
            })}
          </div>

          {/* ───── ACT 3: The CTA ───────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2,
            pointerEvents: 'none',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '0 1.25rem',
            gap: 'clamp(1rem, 2.5vw, 1.5rem)',
          }}>
            <h2 ref={act3HeadRef} style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(1.75rem, 6vw, 4rem)',
              fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
              color: C.text, opacity: 0, maxWidth: '16ch',
            }}>
              Stop guessing.{' '}
              <span style={{
                background: `linear-gradient(90deg, ${C.teal}, ${C.gold})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Start building.
              </span>
            </h2>

            {/* Logo mark */}
            <div ref={logoMarkRef} style={{
              opacity: 0, display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <div style={{
                width: 'clamp(28px, 4.5vw, 36px)', height: 'clamp(28px, 4.5vw, 36px)',
                borderRadius: 8,
                background: `linear-gradient(135deg, ${C.teal}, ${C.gold})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(13px, 2.2vw, 17px)',
                boxShadow: `0 0 28px ${C.tealGlow}`,
              }}>
                🎯
              </div>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(0.875rem, 1.8vw, 1.1rem)',
                color: C.text, letterSpacing: '-0.01em',
              }}>
                ProblemPool
              </span>
            </div>

            {/* CTA button — pointer-events restored */}
            <Link
              ref={ctaBtnRef}
              to="/problems"
              style={{
                pointerEvents: 'all', opacity: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem',
                padding: 'clamp(0.75rem, 2vw, 0.9rem) clamp(1.5rem, 4vw, 2.25rem)',
                minHeight: 52, minWidth: 'min(220px, 78vw)',
                background: C.teal, color: '#060e0d',
                borderRadius: 10,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(0.925rem, 2vw, 1.05rem)',
                letterSpacing: '-0.01em',
                textDecoration: 'none',
                animation: 'pp-btn-pulse 2.8s ease-in-out infinite',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Gold shimmer underline */}
              <span aria-hidden style={{
                position: 'absolute', bottom: 0, left: '-110%', width: '100%', height: 2,
                background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
                animation: 'pp-gold-sweep 2.6s ease-in-out infinite',
              }} />
              Explore Problems
              <ArrowRight size={17} />
            </Link>

            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(0.68rem, 1.3vw, 0.78rem)',
              color: C.faint, letterSpacing: '0.05em',
            }}>
              Free to join · 100 credits on signup
            </p>
          </div>

          {/* Scroll hint */}
          <div aria-hidden style={{
            position: 'absolute',
            bottom: 'clamp(1rem, 3vw, 1.75rem)',
            left: '50%', zIndex: 10,
            animation: 'pp-scroll-bounce 2.2s ease-in-out infinite',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
          }}>
            <span style={{
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: C.faint,
              fontFamily: "'Inter', sans-serif",
            }}>scroll</span>
            <div style={{
              width: 1, height: 28,
              background: `linear-gradient(to bottom, ${C.teal}99, transparent)`,
              borderRadius: 1,
            }} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TICKER — below the cinematic hero
      ════════════════════════════════════════════════ */}
      {ticker.length > 0 && (
        <div className="pp-ticker-wrap" style={{
          background: 'rgba(0,191,166,0.04)',
          borderTop: '1px solid rgba(0,191,166,0.12)',
          borderBottom: '1px solid rgba(0,191,166,0.12)',
          padding: '0.6rem 0', overflow: 'hidden',
        }}>
          <div className="pp-ticker-track" style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}>
            {[...ticker, ...ticker].map((p, i) => (
              <span key={`t-${i}`} aria-hidden={i >= ticker.length} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0 2rem',
                fontSize: '0.79rem',
                color: 'rgba(255,255,255,0.42)',
                fontFamily: "'Inter', sans-serif",
              }}>
                <span style={{ color: '#00BFA6', fontSize: '0.4rem' }}>●</span>
                {(p as unknown as { domain: { icon: string } }).domain?.icon} {p.title}
                <span style={{
                  fontSize: '0.58rem', padding: '0.1rem 0.45rem', borderRadius: 9999,
                  fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                  background: p.difficulty === 'Hard' ? 'rgba(248,81,73,0.14)' : p.difficulty === 'Medium' ? 'rgba(210,153,34,0.14)' : 'rgba(63,185,80,0.14)',
                  color: p.difficulty === 'Hard' ? '#f85149' : p.difficulty === 'Medium' ? '#d29922' : '#3fb950',
                }}>
                  {p.difficulty}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          DOMAINS (logic untouched)
      ════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="container-wide">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Explore by Domain
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              Problems from every sector of the Indian market
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: '1rem' }}>
            {domains.length === 0
              ? Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="card" style={{ padding: '1.25rem', height: 160 }}>
                    <div className="skeleton" style={{ height: '1.75rem', width: '2rem', marginBottom: '0.5rem', borderRadius: 'var(--radius-sm)' }} />
                    <div className="skeleton" style={{ height: '1rem', width: '70%', marginBottom: '0.5rem' }} />
                    <div className="skeleton" style={{ height: '0.875rem', width: '90%' }} />
                  </div>
                ))
              : domains.map((d, i) => (
                  <DomainCard key={d.id} domain={d}
                    imageId={DOMAIN_IMAGES[d.slug] || DOMAIN_IMAGES[d.name?.toLowerCase()] || undefined}
                    className={`stagger-${Math.min(i + 1, 4)}`} />
                ))
            }
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          HOW IT WORKS (logic untouched)
      ════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>From problem to product in 3 steps</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '1.5rem' }}>
            {steps.map((step, i) => (
              <div key={i} className="card card-interactive" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Step {i + 1}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700 }}>{step.title}</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRICING (logic untouched)
      ════════════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Credit Packs
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>One-time purchase. No subscriptions. Ever.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '1.25rem', maxWidth: 860, margin: '0 auto' }}>
            {CREDIT_PACKS.map(pack => (
              <div key={pack.id} className={`card ${pack.popular ? 'card-glow' : 'card-interactive'}`} style={{ padding: '1.875rem', position: 'relative', border: pack.popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', transition: 'all var(--transition-base)' }}>
                {pack.popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, var(--color-primary), #38bdf8)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.22rem 0.875rem', borderRadius: '9999px', letterSpacing: '0.06em', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(14,165,233,0.35)' }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{PACK_ICONS[pack.id]}</span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700 }}>{pack.name}</h3>
                </div>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                  ₹{pack.price}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                  {pack.credits} credits
                </div>
                {[`${Math.floor(pack.credits / 10)} problem unlocks`, `${Math.floor(pack.credits / 15)} AI build plans`, 'Never expires'].map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '0.45rem' }}>
                    <CheckCircle size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    {feat}
                  </div>
                ))}
                <Link to="/auth" className={`btn ${pack.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof row */}
      <section style={{ padding: 'clamp(2rem, 4vw, 3rem) 0', borderTop: '1px solid var(--color-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', width: 'fit-content', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {PROOF_NAMES.map((name, i) => (
                <img key={name} src={`https://ui-avatars.com/api/?name=${name}&size=32&background=random&color=fff&bold=true`} alt={name} loading="lazy" width={32} height={32} style={{ borderRadius: '50%', border: '2px solid var(--color-surface)', marginLeft: i === 0 ? 0 : -8, width: 32, height: 32 }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <TrendingUp size={13} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text)' }}>100+ problems submitted by real users</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>across 9 Indian market domains</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}