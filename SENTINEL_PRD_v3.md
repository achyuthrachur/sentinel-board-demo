# SENTINEL — Multi-Agent Board Intelligence Platform
## Product Requirements Document (PRD)
**Project:** `sentinel-board-demo`
**Owner:** Achyuth Rachur, Crowe AI Innovation Team
**Stack:** Next.js 14 (App Router, TypeScript) — full-stack, single repo
**Orchestration:** LangGraph.js (`@langchain/langgraph`) in Next.js API routes
**LLM:** OpenAI `gpt-4o-mini` via `openai` npm package
**Deploy Target:** Vercel — one deployment, no separate backend, one env var
**GitHub:** `gh repo create achyuthrachur/sentinel-board-demo --public`
**PRD Version:** 3.0

---

## The Problem We're Solving

A board package today takes 3–5 days. A CFO coordinator manually pulls from a dozen
systems — core banking, credit risk models, capital reports, regulatory trackers,
operational risk logs, macro briefings. Someone synthesizes that into a narrative.
A human reviews it, marks it up, sends it back. It's slow, inconsistent, and most
likely to break the day before the board meeting.

SENTINEL is the demo answer: a multi-agent board intelligence system that aggregates
from multiple data sources, processes deterministically where math is math, generates
narrative where synthesis is needed, pauses for human review before final compilation,
and produces a polished board-ready package — with the audience watching the graph
build and execute in real time.

**Who this is for:** CFOs, CROs, CEOs, Board Audit Committee chairs, Chief Risk Officers
at banks and credit unions. This is their problem, their language, their output.

---

## Architecture Decision: Full-Stack Next.js, No Separate Backend

LangGraph ships an official TypeScript port (`@langchain/langgraph`) with the same
primitives as the Python version — `StateGraph`, conditional edges, streaming, and
`interrupt()` for HITL. All of this runs in Next.js Route Handlers (Node.js runtime).

- No Python, no FastAPI, no Railway, no Render, no admin credentials
- One Vercel deployment. One env var: `OPENAI_API_KEY`
- SSE stream implemented as a Next.js Route Handler with `ReadableStream`
- HITL pause/resume via in-memory `Map<runId, resolver>` — sufficient for demo context

---

## What This Is Not

- Not a live data integration with real core banking systems
- Not a multi-user production app (single presenter, demo context)
- Not a writing pipeline that calls GPT at every node
- Not dependent on any external API beyond OpenAI

---

## Core Demo Concept: The Graph That Builds Itself

The audience watches three things happen that are genuinely novel:

1. **Meta-agent fires first.** It evaluates the meeting type and complexity, then
   assembles the minimum viable agent graph. The graph draws itself on screen — nodes
   appear one by one, edges connect, layout settles.

2. **Execution traverses the graph visibly.** Each node lights up with a type badge:
   RULES ENGINE, ML SCORING, AI AGENT, HYBRID, ORCHESTRATOR. Deterministic nodes
   show their formulas. LLM nodes show a thinking pulse. The audience can see — and
   you can narrate — exactly what kind of intelligence is running at each step.

3. **The graph rebuilds for a different scenario.** Switch from a Full Quarterly Package
   to a Risk Committee Flash Report. The meta-agent re-evaluates. Nodes fade out. A
   simpler graph assembles. Same system. Different meeting. Minimum viable intelligence.

This is the moment you say: *"Most AI demos show you a chatbot. This shows you a system
that decides how much AI to apply based on what the task actually needs."*

---

## Three Scenarios

The meta-agent selects which agent nodes to activate based on meeting type and
data completeness signals embedded in the scenario.

### Scenario A — Falcon Board (Full Quarterly Package)
**Meeting type:** Full Board of Directors, Q4 package
**Graph:** 8 nodes — full stack, all agent types represented
**Key moment:** HITL gate fires. CFO reviews the assembled draft before compilation.
**Output:** Full board package (rendered + DOCX download)

Data profile:
- Strong financial performance with one outlier (NIM compression)
- Two open MRAs from the prior OCC exam, one in remediation
- Elevated NPL ratio in the commercial real estate portfolio
- Operational risk incident: a third-party vendor data breach (minor, contained)
- Capital and liquidity ratios within policy but approaching soft limits

### Scenario B — Audit Committee Brief
**Meeting type:** Audit Committee, mid-cycle
**Graph:** 5 nodes — regulatory/audit focus, no financial performance deep-dive
**Key moment:** Supervisor routes to escalation path when an overdue MRA remediation
is detected
**Output:** Audit committee brief (rendered + DOCX download)

Data profile:
- Two MRAs: one on track, one 45 days past remediation deadline
- BSA/AML program review finding: SAR filing timeliness metric below threshold
- Internal audit coverage: 3 high-risk areas completed, 1 deferred
- No significant financial metrics needed for this audience

### Scenario C — Risk Committee Flash Report
**Meeting type:** Risk Committee, monthly flash
**Graph:** 3 nodes — compressed, no HITL, deterministic-first
**Key moment:** Supervisor determines no LLM narrative needed — thresholds all green,
routes directly to templated summary
**Output:** Flash report (rendered + DOCX download)

Data profile:
- All capital/liquidity metrics within policy
- Credit quality stable, no watchlist movements
- No open regulatory findings
- This scenario shows the graph compress — 3 nodes instead of 8

---

## Phased Delivery Plan

---

### Phase 0 — Foundation
**Complete this phase in full before touching Phase 1 or 2.**
Everything downstream depends on the types, state schema, and data layer being locked.

---

#### 0A: Project Scaffold

```
sentinel-board-demo/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── analyze/route.ts          ← POST: start execution, return run_id
│   │       ├── stream/[runId]/route.ts   ← GET: SSE stream
│   │       └── hitl/route.ts             ← POST: resume after HITL pause
│   ├── components/
│   │   ├── GraphCanvas/
│   │   ├── ScenarioPanel/
│   │   ├── StatePanel/
│   │   ├── HITLModal/
│   │   ├── ExecutionLog/
│   │   ├── ReportViewer/
│   │   └── Header/
│   ├── lib/
│   │   ├── graph/                        ← LangGraph.js — all orchestration
│   │   │   ├── state.ts
│   │   │   ├── graph.ts
│   │   │   ├── metaAgent.ts
│   │   │   └── nodes/
│   │   ├── prompts/                      ← all system prompts as .ts string exports
│   │   ├── nodeRegistry.ts
│   │   └── eventEmitter.ts              ← SSE queue management
│   ├── store/
│   │   └── executionStore.ts             ← Zustand
│   ├── hooks/
│   │   ├── useGraphExecution.ts
│   │   └── useSSE.ts
│   ├── types/
│   │   ├── graph.ts
│   │   ├── state.ts
│   │   ├── events.ts
│   │   └── scenarios.ts
│   └── data/
│       ├── scenarios.ts
│       ├── nodeRegistry.ts
│       └── populationBaseline.ts
├── public/
│   └── assets/
│       └── crowe-logo-white-wordmark.png
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── CLAUDE.md
```

Package installs:
```bash
npm install @langchain/langgraph @langchain/openai openai
npm install @xyflow/react                    # ReactFlow v12
npm install zustand
npm install motion                           # motion/react v12
npm install animejs                          # v4 only — NOT animejs@3
npm install docx file-saver                 # DOCX generation
npm install @types/file-saver
npx shadcn@latest init
npx shadcn@latest add button card badge dialog tabs separator
npx shadcn@latest add @react-bits/CountUp-TS-TW
npx shadcn@latest add @react-bits/SpotlightCard-TS-TW
npx shadcn@latest add @react-bits/BlurText-TS-TW
```

---

#### 0B: BoardState TypeScript Interface `/src/lib/graph/state.ts`

The shared state object all agents read from and write to. Define as a LangGraph
`Annotation` object (LangGraph.js state definition pattern):

```typescript
import { Annotation } from '@langchain/langgraph';

export const BoardStateAnnotation = Annotation.Root({
  // Input
  scenarioId: Annotation<string>,
  meetingType: Annotation<string>,
  meetingDate: Annotation<string>,
  institutionName: Annotation<string>,
  rawData: Annotation<ScenarioData>,

  // Deterministic outputs
  financialMetrics: Annotation<FinancialMetrics | null>,
  capitalMetrics: Annotation<CapitalMetrics | null>,
  creditMetrics: Annotation<CreditMetrics | null>,
  kpiScorecard: Annotation<KPIScorecard | null>,

  // Hybrid outputs
  trendAnalysis: Annotation<TrendAnalysis | null>,

  // LLM outputs
  regulatoryDigest: Annotation<RegulatoryDigest | null>,
  operationalRiskDigest: Annotation<OperationalRiskDigest | null>,
  executiveNarrative: Annotation<string | null>,

  // Orchestration
  graphTopology: Annotation<string[]>,          // node IDs selected by meta-agent
  supervisorDecision: Annotation<string | null>,
  loopCount: Annotation<number>,
  supervisorRationale: Annotation<string | null>,

  // HITL
  hitlDecision: Annotation<'pending' | 'approved' | 'revised' | null>,
  hitlNote: Annotation<string | null>,

  // Output
  reportDraft: Annotation<ReportDraft | null>,  // structured, section by section
  reportMarkdown: Annotation<string | null>,    // final rendered markdown
  docxBuffer: Annotation<string | null>,        // base64 encoded DOCX

  // Execution metadata
  activeNode: Annotation<string | null>,
  executionLog: Annotation<ExecutionLogEntry[]>,
  errors: Annotation<string[]>,
});

export type BoardState = typeof BoardStateAnnotation.State;
```

Supporting interfaces in `/src/types/state.ts`:

```typescript
interface FinancialMetrics {
  nim: { value: number; priorPeriod: number; budget: number; variance: number };
  roa: { value: number; priorPeriod: number; budget: number; variance: number };
  roe: { value: number; priorPeriod: number; budget: number; variance: number };
  nonInterestIncome: { value: number; priorPeriod: number; variance: number };
  efficiencyRatio: { value: number; priorPeriod: number };
  ragStatus: 'green' | 'amber' | 'red';
  flags: string[];
}

interface CapitalMetrics {
  cet1Ratio: { value: number; minimum: number; wellCapitalized: number };
  tierOneRatio: { value: number; minimum: number };
  totalCapitalRatio: { value: number; minimum: number };
  lcr: { value: number; minimum: number };
  nsfr: { value: number; minimum: number };
  ragStatus: 'green' | 'amber' | 'red';
  flags: string[];
}

interface CreditMetrics {
  nplRatio: { value: number; priorPeriod: number; peerMedian: number };
  provisionCoverageRatio: { value: number; priorPeriod: number };
  ncoRatio: { value: number; priorPeriod: number };
  concentrations: ConcentrationRisk[];
  watchlistMovements: WatchlistMovement[];
  ragStatus: 'green' | 'amber' | 'red';
  flags: string[];
}

interface RegulatoryDigest {
  openMRAs: MRAItem[];
  overdueItems: MRAItem[];
  upcomingExams: ExamItem[];
  summary: string;             // LLM-generated
  escalationRequired: boolean;
}

interface ReportDraft {
  sections: ReportSection[];
  metadata: { meetingType: string; date: string; preparedBy: string };
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  ragStatus?: 'green' | 'amber' | 'red';
  metrics?: Record<string, unknown>;
}

interface ExecutionLogEntry {
  timestamp: string;
  nodeId: string;
  nodeType: NodeType;
  label: string;
  summary: string;
  durationMs?: number;
}

type NodeType = 'deterministic' | 'algorithmic' | 'hybrid' | 'llm' | 'orchestrator' | 'human';
```

---

#### 0C: Node Registry `/src/data/nodeRegistry.ts`

```typescript
export interface NodeMeta {
  id: string;
  type: NodeType;
  label: string;
  badgeLabel: string;
  color: string;          // border + glow color in ReactFlow
  description: string;    // shown in graph tooltip + narration overlay
  formulaHint?: string;   // shown for deterministic/algorithmic nodes
}

export const NODE_REGISTRY: Record<string, NodeMeta> = {
  meta_agent: {
    id: 'meta_agent',
    type: 'orchestrator',
    label: 'Graph Constructor',
    badgeLabel: 'ORCHESTRATOR',
    color: '#B14FC5',
    description: 'Evaluates meeting type and data complexity. Selects which agents to activate and assembles the execution graph.',
  },
  financial_aggregator: {
    id: 'financial_aggregator',
    type: 'deterministic',
    label: 'Financial Performance',
    badgeLabel: 'RULES ENGINE',
    color: '#0075C9',
    description: 'Calculates NIM, ROA, ROE, efficiency ratio, and variance to budget. No LLM — pure arithmetic against period data.',
    formulaHint: 'NIM = (Interest Income − Interest Expense) / Avg Earning Assets',
  },
  capital_monitor: {
    id: 'capital_monitor',
    type: 'deterministic',
    label: 'Capital & Liquidity',
    badgeLabel: 'RULES ENGINE',
    color: '#0075C9',
    description: 'Compares CET1, Tier 1, LCR, and NSFR to regulatory minimums and well-capitalized thresholds. Flags breaches.',
    formulaHint: 'CET1 ≥ 4.5% minimum | Well-capitalized ≥ 6.5%',
  },
  credit_quality: {
    id: 'credit_quality',
    type: 'algorithmic',
    label: 'Credit Quality',
    badgeLabel: 'ML SCORING',
    color: '#05AB8C',
    description: 'Scores portfolio health using NPL ratio, provision coverage, NCO trend, and concentration limits. Weighted algorithm.',
    formulaHint: 'Credit Health Score = weighted(NPL, PCR, NCO, HHI)',
  },
  trend_analyzer: {
    id: 'trend_analyzer',
    type: 'hybrid',
    label: 'Trend Analyzer',
    badgeLabel: 'HYBRID',
    color: '#54C0E8',
    description: 'Runs statistical trend detection across 5 quarters (deterministic), then generates a 2-sentence narrative interpretation (LLM).',
  },
  regulatory_digest: {
    id: 'regulatory_digest',
    type: 'llm',
    label: 'Regulatory Status',
    badgeLabel: 'AI AGENT',
    color: '#F5A800',
    description: 'Synthesizes open MRAs, exam timelines, and remediation status. Identifies overdue items and escalation triggers.',
  },
  operational_risk: {
    id: 'operational_risk',
    type: 'llm',
    label: 'Operational Risk',
    badgeLabel: 'AI AGENT',
    color: '#F5A800',
    description: 'Reads incident log summaries, identifies themes, and flags items that rise to board-reportable significance.',
  },
  supervisor: {
    id: 'supervisor',
    type: 'orchestrator',
    label: 'Supervisor Agent',
    badgeLabel: 'ORCHESTRATOR',
    color: '#B14FC5',
    description: 'Reviews assembled inputs. Routes to report compilation, loops back for additional analysis, or escalates.',
  },
  hitl_gate: {
    id: 'hitl_gate',
    type: 'human',
    label: 'CFO Review Gate',
    badgeLabel: 'HUMAN REVIEW',
    color: '#E5376B',
    description: 'Execution pauses here. The CFO or CRO reviews the assembled draft metrics and narratives before final compilation.',
  },
  report_compiler: {
    id: 'report_compiler',
    type: 'llm',
    label: 'Report Compiler',
    badgeLabel: 'AI AGENT',
    color: '#F5A800',
    description: 'Takes all structured inputs and HITL-approved draft. Writes the executive narrative and assembles the final board package.',
  },
};
```

---

#### 0D: SSE Event Schema `/src/types/events.ts`

```typescript
export type SSEEventType =
  | 'graph_constructed'
  | 'graph_updated'
  | 'node_started'
  | 'node_completed'
  | 'edge_traversed'
  | 'hitl_pause'
  | 'hitl_resumed'
  | 'loop_back'
  | 'execution_complete'
  | 'error';

export interface GraphConstructedEvent {
  type: 'graph_constructed';
  nodes: string[];
  edges: EdgeDef[];
  rationale: string;
  nodeCount: number;
}

export interface NodeStartedEvent {
  type: 'node_started';
  nodeId: string;
  nodeType: NodeType;
  label: string;
  timestamp: string;
}

export interface NodeCompletedEvent {
  type: 'node_completed';
  nodeId: string;
  outputSummary: string;
  stateDelta: Partial<BoardState>;
  durationMs: number;
}

export interface HITLPauseEvent {
  type: 'hitl_pause';
  riskSummary: {
    financialRag: 'green' | 'amber' | 'red';
    capitalRag: 'green' | 'amber' | 'red';
    creditRag: 'green' | 'amber' | 'red';
    openMRAs: number;
    overdueRemediations: number;
    keyFlags: string[];
  };
  draftSections: ReportSection[];
}

export interface ExecutionCompleteEvent {
  type: 'execution_complete';
  reportMarkdown: string;
  docxAvailable: boolean;
  totalDurationMs: number;
  nodesExecuted: number;
}

export type SSEEvent =
  | GraphConstructedEvent
  | NodeStartedEvent
  | NodeCompletedEvent
  | HITLPauseEvent
  | ExecutionCompleteEvent
  | { type: 'edge_traversed'; fromNode: string; toNode: string; edgeLabel: string }
  | { type: 'hitl_resumed'; decision: 'approved' | 'revised'; note: string | null }
  | { type: 'loop_back'; fromNode: string; toNode: string; reason: string; loopCount: number }
  | { type: 'graph_updated'; addedNodes: string[]; removedNodes: string[]; reason: string }
  | { type: 'error'; message: string; nodeId: string | null };

export interface EdgeDef {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: 'default' | 'conditional' | 'loop';
}
```

---

#### 0E: Synthetic Scenario Data `/src/data/scenarios.ts`

Each scenario is a complete self-contained data object. All financial figures are
realistic for a $2–5B community bank.

**Scenario A — Falcon Board (Full Quarterly, 8 nodes)**
```
Amount: Q4 2024 full board package
NIM: 3.21% vs budget 3.40% (compressed — flag)
ROA: 1.02% vs budget 1.05%
ROE: 10.8% vs budget 11.0%
Efficiency ratio: 61.4% (rising — flag)
CET1: 10.8% (well above minimum, slowly declining)
NPL ratio: 1.84% vs peer median 1.20% (elevated CRE — flag)
CRE concentration HHI: 0.34 vs limit 0.30 (breached)
MRA-2024-01: CECL documentation — In Remediation, 85 days remaining
MRA-2024-02: BSA/AML SAR timeliness — Past Due, -18 days (triggers escalation)
Vendor incident: data exposure, 1,200 accounts, remediated
expectedNodes: all 10 nodes including hitl_gate
```

**Scenario B — Audit Committee (5 nodes, escalation path)**
```
No financial/capital/credit data needed
Same two MRAs as Scenario A
Internal audit coverage: BSA/AML (2 findings), Credit (0), ITGC (1), Vendor (deferred)
expectedNodes: meta_agent, regulatory_digest, operational_risk, supervisor, report_compiler
```

**Scenario C — Risk Committee Flash (3 nodes, compressed)**
```
CET1: 11.2%, LCR: 124%, NSFR: 118% — all green
NPL ratio: 1.18% vs peer 1.20% — stable
No MRAs, no incidents
expectedNodes: meta_agent, capital_monitor, credit_quality, report_compiler
Supervisor routes SKIP_HITL_COMPILE
```

---

#### 0F: Population Baseline `/src/data/populationBaseline.ts`

Synthetic 5-quarter rolling data for trend detection (used by `trend_analyzer` node):

```typescript
export const POPULATION_BASELINE = {
  nim:              [3.58, 3.52, 3.44, 3.44, 3.21],   // Q4'23 → Q4'24
  roa:              [0.94, 0.96, 0.98, 1.00, 1.02],
  roe:              [9.8,  10.0, 10.2, 10.5, 10.8],
  nplRatio:         [0.98, 1.12, 1.28, 1.41, 1.84],   // inflecting upward
  efficiencyRatio:  [58.2, 58.9, 59.8, 60.4, 61.4],   // rising
  cet1Ratio:        [11.4, 11.2, 11.0, 10.9, 10.8],   // slowly declining
  peerMedianNPL:    [1.05, 1.10, 1.15, 1.18, 1.20],
};
```

---

### Phase 1 — LangGraph.js Orchestration
*Build after Phase 0 is complete. Concurrent with Phase 2 once Phase 0 is locked.*

All orchestration code lives in `/src/lib/graph/`.

---

#### 1A: SSE Event Emitter `/src/lib/eventEmitter.ts`

In-memory Map per run_id. Nodes call `emit(runId, event)` to push events to frontend.
HITL pause/resume uses a separate resolver Map.

---

#### 1B: Meta-Agent `/src/lib/graph/metaAgent.ts`

Single OpenAI call (temperature 0.0, JSON mode) with node registry and scenario profile.
Returns `{ topology: string[], rationale: string }`.
Fallback: derive topology deterministically from `scenario.expectedNodes`.

---

#### 1C: Node Implementations `/src/lib/graph/nodes/`

Each node: `async (state: BoardState, config: { runId: string }) => Promise<Partial<BoardState>>`

- **financialAggregator** — DETERMINISTIC: variance math, RAG assignment, no LLM
- **capitalMonitor** — DETERMINISTIC: threshold comparison, flag within 150bps of minimum
- **creditQuality** — ALGORITHMIC: weighted score (NPL 0.35, PCR 0.25, NCO 0.20, concentration 0.20)
- **trendAnalyzer** — HYBRID: linear regression first, LLM narrative only if flags found
- **regulatoryDigest** — LLM: JSON mode, 0.1 temp, escalation detection
- **operationalRisk** — LLM: JSON mode, 0.2 temp, board-reportable identification
- **supervisor** — LLM: routes PROCEED_TO_HITL / SKIP_HITL_COMPILE / LOOP_BACK / ESCALATE
- **hitlGate** — HUMAN: LangGraph interrupt(), emits hitl_pause, resumes on POST /api/hitl
- **reportCompiler** — LLM: 0.4 temp, 7-section structured output, triggers DOCX generation

---

#### 1D: Dynamic Graph Assembly `/src/lib/graph/graph.ts`

`buildGraph(topology: string[])` — builds StateGraph dynamically per execution.
Adds only nodes in topology. Conditional edges from supervisor. Compiled per run_id.

---

#### 1E: API Routes

- `POST /api/analyze` — starts execution, returns run_id
- `GET /api/stream/[runId]` — SSE stream, Node.js runtime
- `POST /api/hitl` — resumes after HITL pause

---

#### 1F: DOCX Generation `/src/lib/docx/`

`docx` npm package (JS, not python-docx). Returns base64 string.
Crowe styling: Indigo Dark headings, Amber table headers, RAG-colored cells.
Page header/footer with institution name and CONFIDENTIAL tag.

---

### Phase 2 — Next.js Frontend (ReactFlow + Shadcn)
*Concurrent with Phase 1 once Phase 0 is complete.*

**Aesthetic:** Luxury / refined — Crowe dark theme. C-suite demo quality.

**Color Tokens:**
```css
--background:     #011E41;
--surface:        #002E62;
--surface-raised: #003F9F;
--accent:         #F5A800;
--accent-bright:  #FFD231;
--teal:           #05AB8C;
--cyan:           #54C0E8;
--coral:          #E5376B;
--violet:         #B14FC5;
--text-primary:   #FFFFFF;
--text-muted:     #8FE1FF;
--border:         rgba(255,255,255,0.08);
--border-active:  rgba(245,168,0,0.4);
```

**Fonts:** Syne (display, 700/800) + IBM Plex Sans (body, 400/500) + IBM Plex Mono

---

#### 2A: App Layout — 3-panel + footer, 100vh, no page scroll
#### 2B: ReactFlow Graph Canvas + 6 custom node types + AnimatedEdge + MetaAgentReveal
#### 2C: Left Panel — SpotlightCard scenario cards + RunControls with Anime.js glow
#### 2D: Right Panel — Live State tab + Report Preview tab + Download tab
#### 2E: HITL Modal — full-screen overlay, RAG summary, approve/escalate
#### 2F: Execution Log — fixed 120px footer, horizontal scroll, motion/react entries
#### 2G: Zustand Store + SSE Hook — single source of truth, speed pacing

---

### Phase 3 — Dynamic Graph Reconstruction
*After Phase 1 + 2 are working end-to-end.*

- **3A:** Live graph rebuild on scenario switch + side-by-side comparison mode
- **3B:** Graph diff annotation panel (selected vs skipped nodes)

---

### Phase 4 — Presentation Mode Polish

- **4A:** Keyboard shortcuts (Space, R, 1/2/3, S/N/F, C)
- **4B:** Narration overlay cards fired by execution events
- **4C:** One-click demo reset

---

## Component Inventory

```
src/
  app/
    page.tsx, layout.tsx, globals.css
    api/analyze/route.ts, api/stream/[runId]/route.ts, api/hitl/route.ts
  components/
    GraphCanvas/: GraphCanvas, 6 node types, AnimatedEdge, GraphLegend, MetaAgentReveal
    ScenarioPanel/: ScenarioPanel, ScenarioCard, RunControls
    StatePanel/: StatePanel, LiveStateTab, ScoreRing, CapitalGauges, RAGSummary,
                 ReportPreviewTab, DownloadTab
    HITLModal/: HITLModal, HITLRiskSummary
    ExecutionLog/: ExecutionLog, ExecutionLogEntry
    Header/: Header
  lib/
    graph/: state.ts, graph.ts, metaAgent.ts, nodes/ (9 files)
    prompts/: 6 prompt files
    docx/: generateBoardPackage.ts, croweStyling.ts
    eventEmitter.ts, nodeRegistry.ts
  store/: executionStore.ts
  hooks/: useGraphExecution.ts, useSSE.ts
  types/: graph.ts, state.ts, events.ts, scenarios.ts
  data/: scenarios.ts, nodeRegistry.ts, populationBaseline.ts
```

---

## API Contract

```
POST /api/analyze     { scenario_id } → { run_id, graph_topology, node_count }
GET  /api/stream/[id] → SSE stream of SSEEvent objects
POST /api/hitl        { run_id, decision, note? } → { status: 'resumed' }
```

---

## Environment Variables

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

---

## Out of Scope

- Real data integration, auth, persistent storage, multi-user, mobile, voice, PPT export

---

## Deliverable Checklist

### Phase 0
- [ ] Project scaffold + all packages installed
- [ ] `BoardStateAnnotation` in `/src/lib/graph/state.ts`
- [ ] All supporting interfaces in `/src/types/state.ts`
- [ ] `NODE_REGISTRY` in `/src/data/nodeRegistry.ts`
- [ ] SSE event types in `/src/types/events.ts`
- [ ] All 3 scenarios in `/src/data/scenarios.ts`
- [ ] `POPULATION_BASELINE` in `/src/data/populationBaseline.ts`
- [ ] Type definitions in `/src/types/graph.ts` and `scenarios.ts`

### Phase 1
- [ ] `eventEmitter.ts` with SSE + HITL resolver Maps
- [ ] All 9 node functions implemented
- [ ] All 6 system prompts
- [ ] `buildGraph()` correct for all 3 scenarios
- [ ] Meta-agent + rules-based fallback working
- [ ] HITL pause/resume end-to-end
- [ ] Supervisor routes correctly (all 4 paths)
- [ ] Loop back increments correctly
- [ ] Risk Flash → 3 nodes → SKIP_HITL_COMPILE
- [ ] DOCX generates valid styled file
- [ ] All 3 API routes working
- [ ] Full Falcon Board run completes

### Phase 2
- [ ] All 6 custom ReactFlow node types
- [ ] Node states animate (idle/active/completed/paused)
- [ ] AnimatedEdge with traveling dot
- [ ] Loop-back edge in coral dashed style
- [ ] MetaAgentReveal animation on graph_constructed
- [ ] Graph construction stagger animation
- [ ] HITL modal fires and resumes
- [ ] Live State tab populates in real time
- [ ] Score ring animates
- [ ] Report Preview renders on execution_complete
- [ ] DOCX download triggers correctly
- [ ] Execution log footer animates
- [ ] Speed control works
- [ ] Reset clears state without refresh
- [ ] SpotlightCard + amber glow pulse working
- [ ] Crowe logo in header

### Phase 3
- [ ] Scenario switch triggers graph rebuild
- [ ] Side-by-side comparison mode
- [ ] Graph diff annotation panel

### Phase 4
- [ ] Keyboard shortcuts
- [ ] Narration overlays at correct events
- [ ] No console errors
- [ ] Lighthouse Performance > 85, Accessibility > 90
- [ ] Tested at 1920×1080 and 1440×900

---

## Deployment

```bash
gh repo create achyuthrachur/sentinel-board-demo --public --source=. --remote=origin --push
# Import at vercel.com/new → add OPENAI_API_KEY → Deploy
```

---

## Kickoff Prompt for Claude Code

```
Read SENTINEL_PRD_v3.md fully before writing any code.

We are building SENTINEL — a multi-agent board intelligence demo using LangGraph.js
(TypeScript) inside Next.js 14 App Router. No Python. No separate backend. One Vercel
deployment. One env var: OPENAI_API_KEY.

Start with Phase 0 only. Do not begin Phase 1 or 2 until all Phase 0 checklist
items are confirmed complete.

Phase 0 execution order:
1. Scaffold: npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint
2. Install all packages from Phase 0A exactly
3. Create /src/lib/graph/state.ts with BoardStateAnnotation
4. Create /src/types/state.ts, events.ts, graph.ts, scenarios.ts
5. Create /src/data/nodeRegistry.ts with complete NODE_REGISTRY (all 10 nodes)
6. Create /src/data/scenarios.ts with all 3 scenarios — full data, no placeholders
7. Create /src/data/populationBaseline.ts
8. Create CLAUDE.md with stack rules (see below)

Confirm type consistency across all files before Phase 1.

Stack rules for CLAUDE.md:
- Next.js 14 App Router, TypeScript strict
- LangGraph.js (@langchain/langgraph) — NOT Python version
- OpenAI: gpt-4o-mini
- Animation: motion/react v12 (NOT framer-motion), animejs v4 (NOT v3)
- ReactFlow: @xyflow/react v12
- Brand: #011E41 background, #F5A800 accent
- Fonts: Syne + IBM Plex Sans + IBM Plex Mono — NEVER Inter/Roboto/Arial/system-ui
- Node function signature: async (state: BoardState, config: { runId: string }) => Promise<Partial<BoardState>>
- All prompts: /src/lib/prompts/ as exported TypeScript strings
```

---

*PRD Version 3.0 | Crowe AI Innovation Team | March 2026*
*SENTINEL — Multi-Agent Board Intelligence Platform*
