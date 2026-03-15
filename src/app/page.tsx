'use client';

import Link from 'next/link';
import { useRef } from 'react';
import {
  AlertTriangle,
  Clock,
  FileX,
  ArrowRight,
  TrendingUp,
  Hash,
  GitMerge,
  Sparkles,
  Brain,
  PauseCircle,
} from 'lucide-react';
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { Particles } from '@/components/ui/particles';
import { TextAnimate } from '@/components/ui/text-animate';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { MagicCard } from '@/components/ui/magic-card';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { BorderBeam } from '@/components/ui/border-beam';
import { FlickeringGrid } from '@/components/ui/flickering-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CroweLogo } from '@/components/ui/CroweLogo';

// ─── Pipeline Diagram (B3) ────────────────────────────────────────────────────

const STAGES = [
  { id: 'input', label: 'Board Input', color: '#8FE1FF' },
  { id: 'meta', label: 'Meta-Agent', color: '#B14FC5' },
  { id: 'analysis', label: 'Analysis Nodes', color: '#05AB8C' },
  { id: 'supervisor', label: 'Supervisor', color: '#B14FC5' },
  { id: 'output', label: 'Board Report', color: '#F5A800' },
];

function PipelineDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const supervisorRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const stageRefs = [inputRef, metaRef, analysisRef, supervisorRef, outputRef];

  return (
    <div ref={containerRef} className="relative flex items-center justify-between gap-2 px-4 py-8">
      {STAGES.map((stage, i) => (
        <div
          key={stage.id}
          ref={stageRefs[i]}
          className="relative flex flex-col items-center justify-center rounded-2xl border px-4 py-3 text-center"
          style={{
            borderColor: `${stage.color}40`,
            backgroundColor: `${stage.color}0D`,
            minWidth: 120,
          }}
        >
          <div
            className="mb-1 h-2 w-2 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: stage.color, fontFamily: 'var(--font-mono)' }}
          >
            {stage.label}
          </span>
        </div>
      ))}

      {/* Beams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={inputRef}
        toRef={metaRef}
        pathColor="rgba(177,79,197,0.3)"
        gradientStartColor="#B14FC5"
        gradientStopColor="#B14FC5"
        duration={2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={metaRef}
        toRef={analysisRef}
        pathColor="rgba(5,171,140,0.3)"
        gradientStartColor="#05AB8C"
        gradientStopColor="#05AB8C"
        duration={2.5}
        delay={0.3}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={analysisRef}
        toRef={supervisorRef}
        pathColor="rgba(177,79,197,0.3)"
        gradientStartColor="#B14FC5"
        gradientStopColor="#B14FC5"
        duration={2}
        delay={0.6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={supervisorRef}
        toRef={outputRef}
        pathColor="rgba(245,168,0,0.3)"
        gradientStartColor="#F5A800"
        gradientStopColor="#F5A800"
        duration={2}
        delay={0.9}
      />
    </div>
  );
}

// ─── Agent tile data (B4) ─────────────────────────────────────────────────────

const AGENT_TILES = [
  {
    nodeId: 'financial_aggregator',
    label: 'Financial Aggregator',
    badge: 'DETERMINISTIC',
    color: '#0075C9',
    Icon: Hash,
    desc: 'Computes NIM, ROA, ROE, and efficiency ratio from raw financial data.',
  },
  {
    nodeId: 'capital_monitor',
    label: 'Capital Monitor',
    badge: 'DETERMINISTIC',
    color: '#0075C9',
    Icon: Hash,
    desc: 'Evaluates CET1, Tier 1, and liquidity ratios against regulatory thresholds.',
  },
  {
    nodeId: 'credit_quality',
    label: 'Credit Quality',
    badge: 'ALGORITHMIC',
    color: '#05AB8C',
    Icon: TrendingUp,
    desc: 'ML-scores credit portfolio health using NPL, provision, and HHI concentration.',
  },
  {
    nodeId: 'trend_analyzer',
    label: 'Trend Analyzer',
    badge: 'HYBRID',
    color: '#54C0E8',
    Icon: GitMerge,
    desc: 'Computes 5-quarter rolling trends with narrative trajectory interpretation.',
  },
  {
    nodeId: 'regulatory_digest',
    label: 'Regulatory Digest',
    badge: 'AI AGENT',
    color: '#F5A800',
    Icon: Sparkles,
    desc: 'Synthesizes open MRAs and upcoming exam schedules into regulatory narrative.',
  },
  {
    nodeId: 'operational_risk',
    label: 'Operational Risk',
    badge: 'AI AGENT',
    color: '#F5A800',
    Icon: Sparkles,
    desc: 'Analyzes operational incidents and control gaps to produce risk digest.',
  },
  {
    nodeId: 'meta_agent',
    label: 'Meta-Agent',
    badge: 'ORCHESTRATOR',
    color: '#B14FC5',
    Icon: Brain,
    desc: 'Constructs the dynamic execution graph based on scenario requirements.',
  },
  {
    nodeId: 'supervisor',
    label: 'Supervisor',
    badge: 'ORCHESTRATOR',
    color: '#B14FC5',
    Icon: Brain,
    desc: 'Reviews all node outputs and decides whether to loop back or proceed.',
  },
  {
    nodeId: 'hitl_gate',
    label: 'HITL Gate',
    badge: 'HUMAN',
    color: '#E5376B',
    Icon: PauseCircle,
    desc: 'Pauses execution for board-level human approval before final compilation.',
  },
  {
    nodeId: 'report_compiler',
    label: 'Report Compiler',
    badge: 'AI AGENT',
    color: '#F5A800',
    Icon: Sparkles,
    desc: 'Assembles all node outputs into the final board intelligence report.',
  },
];

// ─── Synthetic data for preview (B5) ─────────────────────────────────────────

type TrendDirection = 'up' | 'down' | 'neutral';

const FINANCIAL_ROWS: { label: string; current: string; prior: string; trend: TrendDirection }[] = [
  { label: 'NIM', current: '3.21%', prior: '3.44%', trend: 'down' },
  { label: 'ROA', current: '1.02%', prior: '1.00%', trend: 'up' },
  { label: 'ROE', current: '10.80%', prior: '10.50%', trend: 'up' },
  { label: 'Efficiency Ratio', current: '61.40%', prior: '60.40%', trend: 'down' },
  { label: 'Non-Interest Income', current: '$72.4M', prior: '$74.1M', trend: 'down' },
];

const CAPITAL_ROWS: { label: string; current: string; minimum: string; trend: TrendDirection }[] = [
  { label: 'CET1', current: '10.80%', minimum: '4.50%', trend: 'up' },
  { label: 'Tier 1', current: '11.90%', minimum: '6.00%', trend: 'up' },
  { label: 'Total Capital', current: '13.40%', minimum: '8.00%', trend: 'up' },
  { label: 'LCR', current: '112%', minimum: '100%', trend: 'up' },
  { label: 'NSFR', current: '109%', minimum: '100%', trend: 'up' },
];

const CREDIT_ROWS: { label: string; current: string; peer: string; trend: TrendDirection }[] = [
  { label: 'NPL Ratio', current: '1.84%', peer: '1.20%', trend: 'down' },
  { label: 'Provision Coverage', current: '118%', peer: '132%', trend: 'down' },
  { label: 'NCO Ratio', current: '0.42%', peer: '0.28%', trend: 'down' },
  { label: 'CRE Concentration', current: '336%', peer: '300%', trend: 'down' },
];

const TRENDS_ROWS: { label: string; q1: string; q2: string; q3: string; q4: string; trend: TrendDirection }[] = [
  { label: 'NIM', q1: '3.51%', q2: '3.44%', q3: '3.38%', q4: '3.21%', trend: 'down' },
  { label: 'ROA', q1: '0.98%', q2: '1.00%', q3: '1.01%', q4: '1.02%', trend: 'up' },
  { label: 'CET1', q1: '10.4%', q2: '10.5%', q3: '10.7%', q4: '10.8%', trend: 'up' },
  { label: 'NPL', q1: '1.21%', q2: '1.32%', q3: '1.58%', q4: '1.84%', trend: 'down' },
];

function TrendArrow({ direction }: { direction: TrendDirection }) {
  if (direction === 'up') return <span style={{ color: '#05AB8C' }}>↑</span>;
  if (direction === 'down') return <span style={{ color: '#E5376B' }}>↓</span>;
  return <span style={{ color: '#8FE1FF' }}>→</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      className="w-full text-white"
      style={{ backgroundColor: 'var(--background)', fontFamily: 'var(--font-body)' }}
    >
      {/* ── B1: Hero ── */}
      <section id="hero" className="relative min-h-screen">
        {/* Subtle animated grid */}
        <AnimatedGridPattern
          className="absolute inset-0 h-full w-full opacity-[0.04] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,white,transparent)]"
          numSquares={50}
          maxOpacity={0.6}
          duration={6}
          width={40}
          height={40}
        />
        {/* Floating amber particles — very low density */}
        <Particles
          className="absolute inset-0"
          quantity={40}
          ease={80}
          color="#F5A800"
          size={0.5}
          staticity={70}
        />
        {/* Radial depth vignette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,63,159,0.18) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <CroweLogo size="lg" className="mb-8" />

          <TextAnimate
            animation="blurInUp"
            by="word"
            as="h1"
            className="mb-4 max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-display)' }}
            startOnView={false}
          >
            Board-level intelligence, assembled in real time.
          </TextAnimate>

          <TextAnimate
            animation="blurInUp"
            by="word"
            delay={0.5}
            as="p"
            className="mb-10 max-w-xl text-lg"
            style={{ color: 'var(--text-muted)' }}
            startOnView={false}
          >
            SENTINEL orchestrates AI agents to compile complete board packages — financial, capital, credit, regulatory — in under 30 seconds.
          </TextAnimate>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/demo">
              <ShimmerButton
                background="rgba(245,168,0,0.15)"
                shimmerColor="#F5A800"
                className="px-8 py-3 text-sm font-bold uppercase tracking-widest text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Watch the Demo <ArrowRight size={14} className="ml-2 inline" />
              </ShimmerButton>
            </Link>
            <a href="#agents">
              <ShinyButton className="px-8 py-3 text-sm font-bold uppercase tracking-widest">
                See the Agents ↓
              </ShinyButton>
            </a>
          </div>

          {/* Floating metrics */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
            {[
              { label: 'agents', value: 10, suffix: '' },
              { label: 'scenarios', value: 3, suffix: '' },
              { label: 'second compile', value: 30, suffix: '<' },
            ].map(({ label, value, suffix }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl border px-8 py-4"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                }}
              >
                <div
                  className="text-3xl font-extrabold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
                >
                  {suffix}
                  <NumberTicker value={value} />
                </div>
                <div
                  className="mt-1 text-xs uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── B2: Problem Statement ── */}
      <section
        id="problem"
        className="px-6 py-24"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-4 text-center text-3xl font-extrabold text-white md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Board meetings run on stale data
          </h2>
          <p className="mb-12 text-center text-base" style={{ color: 'var(--text-muted)' }}>
            Finance teams spend days — not hours — assembling board packages from disparate systems.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                Icon: Clock,
                title: 'Manual Aggregation',
                body: 'Analysts copy-paste from 6+ source systems into templates every quarter, taking 3–5 days per package.',
                color: '#E5376B',
              },
              {
                Icon: AlertTriangle,
                title: 'No Real-Time Loops',
                body: 'By the time the board sees numbers, market conditions have shifted — there\'s no mechanism to rerun analysis.',
                color: '#F5A800',
              },
              {
                Icon: FileX,
                title: 'No Audit Trail',
                body: 'Excel-driven workflows leave no trace of who approved what, when, or which version of data was used.',
                color: '#54C0E8',
              },
            ].map(({ Icon, title, body, color }) => (
              <MagicCard
                key={title}
                className="flex flex-col rounded-[1.5rem] border border-white/8 bg-[var(--surface-raised)] p-6"
                gradientColor={`${color}25`}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  <Icon size={20} />
                </div>
                <h3
                  className="mb-2 text-base font-extrabold text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {body}
                </p>
              </MagicCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── B3: How It Works ── */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-4 text-center text-3xl font-extrabold text-white md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            How SENTINEL assembles a board package
          </h2>
          <p className="mb-12 text-center text-base" style={{ color: 'var(--text-muted)' }}>
            Five stages. Zero manual steps. Fully auditable.
          </p>

          <PipelineDiagram />

          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {[
              {
                stage: '01',
                title: 'Board Input',
                desc: 'Scenario data — financials, capital ratios, credit portfolio, regulatory items — is passed as structured JSON.',
                color: '#8FE1FF',
              },
              {
                stage: '02',
                title: 'Meta-Agent',
                desc: 'GPT-4o decides which analysis nodes are needed for this specific scenario and constructs the execution graph.',
                color: '#B14FC5',
              },
              {
                stage: '03',
                title: 'Analysis Nodes',
                desc: 'Deterministic, algorithmic, hybrid, and LLM nodes run in sequence — each pushing live state updates to the UI.',
                color: '#05AB8C',
              },
              {
                stage: '04',
                title: 'Supervisor',
                desc: 'Reviews all node outputs and decides to proceed, loop back for refinement, or escalate to human review.',
                color: '#B14FC5',
              },
              {
                stage: '05',
                title: 'Board Report',
                desc: 'Final executive narrative assembled with supporting metrics, downloadable as DOCX with full audit trail.',
                color: '#F5A800',
              },
            ].map(({ stage, title, desc, color }) => (
              <CardSpotlight
                key={stage}
                className="rounded-[1.5rem] p-4"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
                color={`${color}18`}
              >
                <div
                  className="mb-2 text-xs font-bold uppercase tracking-widest"
                  style={{ color, fontFamily: 'var(--font-mono)' }}
                >
                  {stage}
                </div>
                <div
                  className="mb-1 text-sm font-extrabold text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {desc}
                </p>
              </CardSpotlight>
            ))}
          </div>
        </div>
      </section>

      {/* ── B4: Node Type Explainer ── */}
      <section
        id="agents"
        className="px-6 py-24"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-5xl">
          <h2
            className="mb-4 text-center text-3xl font-extrabold text-white md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Meet the agents
          </h2>
          <p className="mb-12 text-center text-base" style={{ color: 'var(--text-muted)' }}>
            Ten specialized nodes — each with a distinct role and execution model.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENT_TILES.map(({ nodeId, label, badge, color, Icon, desc }) => (
              <SpotlightCard
                key={nodeId}
                className="rounded-[1.5rem] border p-5"
                style={{
                  borderColor: `${color}30`,
                  backgroundColor: 'rgba(0,46,98,0.5)',
                }}
                spotlightColor={`${color}22`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div
                      className="text-sm font-extrabold text-white"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {label}
                    </div>
                    <div
                      className="text-[9px] font-bold uppercase tracking-widest"
                      style={{ color, fontFamily: 'var(--font-mono)' }}
                    >
                      {badge}
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {desc}
                </p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── B5: Synthetic Data Preview ── */}
      <section id="data" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-4 text-center text-3xl font-extrabold text-white md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What SENTINEL ingests
          </h2>
          <p className="mb-12 text-center text-base" style={{ color: 'var(--text-muted)' }}>
            Falcon Community Bank · Q4 2024 board package — synthetic data.
          </p>

          <Tabs defaultValue="financial">
            <TabsList className="mb-6 flex w-full flex-wrap gap-2 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-2">
              {['financial', 'capital', 'credit', 'trends'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 rounded-xl px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#8FE1FF] transition-colors data-[state=active]:bg-white/[0.08] data-[state=active]:text-white"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="financial">
              <div className="relative overflow-hidden rounded-[1.5rem] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <BorderBeam colorFrom="#F5A800" colorTo="#54C0E8" size={120} duration={4} />
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Metric</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Q4 Actual</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Prior Period</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FINANCIAL_ROWS.map((row) => (
                      <tr key={row.label} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-4 py-3 font-medium text-white" style={{ fontFamily: 'var(--font-body)' }}>{row.label}</td>
                        <td className="px-4 py-3 text-right font-semibold text-white">{row.current}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>{row.prior}</td>
                        <td className="px-4 py-3 text-right text-base font-bold"><TrendArrow direction={row.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="capital">
              <div className="relative overflow-hidden rounded-[1.5rem] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <BorderBeam colorFrom="#05AB8C" colorTo="#54C0E8" size={120} duration={4} />
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Metric</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Current</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Minimum</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CAPITAL_ROWS.map((row) => (
                      <tr key={row.label} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-4 py-3 font-medium text-white">{row.label}</td>
                        <td className="px-4 py-3 text-right font-semibold text-white">{row.current}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>{row.minimum}</td>
                        <td className="px-4 py-3 text-right text-base font-bold"><TrendArrow direction={row.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="credit">
              <div className="relative overflow-hidden rounded-[1.5rem] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <BorderBeam colorFrom="#E5376B" colorTo="#F5A800" size={120} duration={4} />
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Metric</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Current</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Peer Median</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CREDIT_ROWS.map((row) => (
                      <tr key={row.label} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-4 py-3 font-medium text-white">{row.label}</td>
                        <td className="px-4 py-3 text-right font-semibold text-white">{row.current}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>{row.peer}</td>
                        <td className="px-4 py-3 text-right text-base font-bold"><TrendArrow direction={row.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <div className="relative overflow-hidden rounded-[1.5rem] border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <BorderBeam colorFrom="#54C0E8" colorTo="#B14FC5" size={120} duration={4} />
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                      <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Metric</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Q1</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Q2</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Q3</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Q4</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TRENDS_ROWS.map((row) => (
                      <tr key={row.label} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-4 py-3 font-medium text-white">{row.label}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>{row.q1}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>{row.q2}</td>
                        <td className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>{row.q3}</td>
                        <td className="px-4 py-3 text-right font-semibold text-white">{row.q4}</td>
                        <td className="px-4 py-3 text-right text-base font-bold"><TrendArrow direction={row.trend} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ── B6: CTA / Footer ── */}
      <section id="cta" className="relative overflow-hidden px-6 py-32 text-center">
        <div className="absolute inset-0">
          <FlickeringGrid
            className="absolute inset-0 h-full w-full"
            squareSize={4}
            gridGap={6}
            color="#F5A800"
            maxOpacity={0.04}
            flickerChance={0.08}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <CroweLogo size="lg" />
          <p
            className="max-w-md text-base"
            style={{ color: 'var(--text-muted)' }}
          >
            Experience the full multi-agent board intelligence demo — live execution, human-in-the-loop review, and instant report generation.
          </p>
          <Link href="/demo">
            <ShimmerButton
              background="rgba(245,168,0,0.15)"
              shimmerColor="#F5A800"
              className="px-10 py-4 text-sm font-bold uppercase tracking-widest text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Launch the Demo <ArrowRight size={14} className="ml-2 inline" />
            </ShimmerButton>
          </Link>
          <p
            className="mt-4 text-xs uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}
          >
            Built by Crowe AI Innovation Team · 2026
          </p>
        </div>
      </section>
    </div>
  );
}
