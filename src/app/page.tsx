'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'motion/react';
import { AppHeader } from '@/components/layout/AppHeader';
import ShaderBackground from '@/components/shader-background';
import { SpecialText } from '@/components/ui/special-text';
import { AgentGallery } from '@/components/landing/AgentGallery';

// ─── How it works steps ───────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01 — Orchestration',
    accentColor: '#B14FC5',
    title: 'Graph constructor assembles your agent graph',
    desc: 'A meta-agent evaluates your meeting type and builds the minimum set of agents needed. Full board gets 8 nodes. Flash report gets 3.',
    badgeBg: '#F3E8FF', badgeColor: '#612080', badge: 'Orchestrator',
  },
  {
    num: '02 — Deterministic',
    accentColor: '#0075C9',
    title: 'Rules engines compute financials and capital',
    desc: 'Net interest margin, return on assets, capital ratios, liquidity coverage \u2014 calculated with formulas you can see and verify. No AI involved at this stage. Math is math.',
    badgeBg: '#E6F1FB', badgeColor: '#0050AD', badge: 'Rules engine',
  },
  {
    num: '03 — AI synthesis',
    accentColor: '#F5A800',
    title: 'AI agents synthesize regulatory and risk data',
    desc: 'AI agents read open regulatory actions, exam timelines and incident logs. They flag what is board-reportable and escalate what is overdue.',
    badgeBg: '#FFF5D6', badgeColor: '#D7761D', badge: 'AI agent',
  },
  {
    num: '04 — Human review',
    accentColor: '#E5376B',
    title: 'Executive review gate before final compilation',
    desc: 'Execution pauses. The chief financial officer approves or revises the draft. Only then does the report compiler produce the final package.',
    badgeBg: '#FDEEF3', badgeColor: '#992A5C', badge: 'Human in the loop',
  },
];

// ─── Animated stat counter ────────────────────────────────────────────────────

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const numeric = parseInt(value.replace(/\D/g, ''), 10);
    if (isNaN(numeric)) { setDisplay(value); return; }
    const suffix = value.replace(/[0-9]/g, '');
    let start = 0;
    const duration = 1200;
    const step = Math.ceil(numeric / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, numeric);
      setDisplay(`${start}${suffix}`);
      if (start >= numeric) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <div ref={ref}>
      <div style={{ fontSize: 40, fontWeight: 700, color: '#F5A800', lineHeight: 1, marginBottom: 6, fontFamily: 'var(--font-display)' }}>
        {display}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
        {label}
      </div>
    </div>
  );
}

// ─── Header nav ───────────────────────────────────────────────────────────────

function HeaderNav() {
  return (
    <>
      <Link href="/configure">
        <button
          type="button"
          style={{
            height: 36, padding: '0 20px',
            background: '#F5A800', color: '#011E41',
            fontFamily: 'var(--font-body)', fontWeight: 700,
            fontSize: 13, letterSpacing: '0.04em',
            border: 'none', borderRadius: 4, cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Enter platform
        </button>
      </Link>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [showAgents, setShowAgents] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const handleMeetAgents = () => {
    if (showAgents) {
      setShowAgents(false);
    } else {
      setShowAgents(true);
      setTimeout(() => {
        galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)', color: '#333333' }}>
      <ShaderBackground />

      <AppHeader rightContent={<HeaderNav />} />

      {/* ── SECTION 1: HERO ── */}
      <section
        style={{
          position: 'relative',
          paddingTop: 64,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#011E41',
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            padding: '80px 48px 72px',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {/* Scramble title */}
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                color: '#F5A800',
                fontFamily: 'var(--font-display)',
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              <SpecialText className="tracking-tight">SENTINEL</SpecialText>
            </span>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              fontSize: 20,
              color: 'rgba(255,255,255,0.65)',
              marginBottom: 40,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            Board intelligence platform
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              marginBottom: 56,
            }}
          >
            <Link href="/configure">
              <button
                type="button"
                style={{
                  height: 52,
                  padding: '0 32px',
                  background: '#F5A800',
                  color: '#011E41',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                Start the demo
                <span
                  style={{
                    background: '#011E41',
                    color: '#F5A800',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                  }}
                >
                  &rarr;
                </span>
              </button>
            </Link>
            <button
              type="button"
              onClick={handleMeetAgents}
              style={{
                height: 52,
                padding: '0 28px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                border: '1.5px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {showAgents ? 'Hide agents \u2191' : 'Meet the agents \u2193'}
            </button>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            style={{
              display: 'flex',
              gap: 0,
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 32,
              justifyContent: 'center',
            }}
          >
            {[
              { value: '10', label: 'Specialized agents' },
              { value: '3', label: 'Meeting types' },
              { value: '1', label: 'Human review gate' },
              { value: 'Full', label: 'Execution trace' },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  maxWidth: 180,
                  paddingRight: i < arr.length - 1 ? 32 : 0,
                  marginRight: i < arr.length - 1 ? 32 : 0,
                  borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                }}
              >
                <AnimatedStat value={stat.value} label={stat.label} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: AGENT GALLERY ── */}
      <motion.div
        ref={galleryRef}
        initial={{ opacity: 0, y: 40 }}
        animate={showAgents ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          pointerEvents: showAgents ? 'auto' : 'none',
          background: '#011E41',
          overflow: 'hidden',
          ...(showAgents ? {} : { height: 0 }),
        }}
      >
        <AgentGallery />
      </motion.div>

      {/* ── SECTION 3: HOW IT WORKS (kept as-is) ── */}
      <section id="how-it-works" style={{ background: '#FFFFFF', borderTop: '1px solid #E0E0E0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 48px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D7761D', marginBottom: 12 }}>
            How it works
          </p>
          <h2 style={{ fontSize: 34, fontWeight: 700, color: '#011E41', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Four stages, one cohesive package
          </h2>
          <p style={{ fontSize: 16, color: '#4F4F4F', marginBottom: 48, maxWidth: 560 }}>
            Each stage uses the right kind of intelligence — rules where math is math, AI where synthesis is needed.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#BDBDBD', border: '1px solid #BDBDBD', borderRadius: 8, overflow: 'hidden' }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{ background: '#FFFFFF', padding: '28px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#828282', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                  {step.num}
                </div>
                <div style={{ width: 32, height: 3, borderRadius: 2, background: step.accentColor, marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#011E41', marginBottom: 10, lineHeight: 1.3 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: '#4F4F4F', lineHeight: 1.6 }}>
                  {step.desc}
                </div>
                <div style={{ display: 'inline-block', marginTop: 14, padding: '3px 10px', borderRadius: 3, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', background: step.badgeBg, color: step.badgeColor }}>
                  {step.badge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER (kept as-is) ── */}
      <footer style={{ background: '#011E41', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/crowe-logo-white.svg" alt="Crowe" height={20} width={72} />
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            AI Innovation Team &middot; Sentinel &middot; 2026
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
          Confidential — not for distribution
        </div>
      </footer>
    </div>
  );
}
