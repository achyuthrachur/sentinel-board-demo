# SENTINEL — Agent Kickoff Prompts
## Copy-paste prompts for Claude Code and Codex, in execution order
**Project:** `sentinel-board-demo`
**PRD Reference:** `SENTINEL_PRD_v3.md` (must be in project root before starting)

---

> **Before anything:** Clone the repo, drop `SENTINEL_PRD_v3.md` into the project
> root, and run through these prompts in phase order. Do not skip ahead.
> Claude Code sessions: start each one fresh. Codex tasks: can run in parallel
> within the same phase once Phase 0 is confirmed complete.

---

## PHASE 0 — Foundation

---

### 0-A › CLAUDE CODE — Project Scaffold + Core Types

```
Read SENTINEL_PRD_v3.md in full before writing any code.

Task: Phase 0 scaffold — project structure, dependencies, and all type definitions.

Execute in this exact order:

1. Scaffold the project:
   npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint
   (Use current directory, not a subdirectory)

2. Install all dependencies from Phase 0A of the PRD exactly as listed.
   For animejs — install v4 only. Confirm the installed version is 4.x before proceeding.
   For motion — install the `motion` package (NOT framer-motion).

3. Create /src/lib/graph/state.ts
   Implement BoardStateAnnotation using @langchain/langgraph Annotation.Root pattern.
   Implement all supporting interfaces: FinancialMetrics, CapitalMetrics, CreditMetrics,
   RegulatoryDigest, ReportDraft, ReportSection, ExecutionLogEntry, and all sub-types.
   Export BoardState as the inferred type from BoardStateAnnotation.State.

4. Create /src/types/state.ts — all supporting interfaces (separate from the Annotation)
5. Create /src/types/events.ts — complete SSEEvent union type and all event interfaces
6. Create /src/types/graph.ts — EdgeDef, NodeExecutionState, ReactFlow node variant types
7. Create /src/types/scenarios.ts — ScenarioData and all nested types

8. Create /src/data/nodeRegistry.ts — complete NODE_REGISTRY object with all 10 nodes
   exactly as specified in Phase 0C of the PRD. Every node needs: id, type, label,
   badgeLabel, color, description. Deterministic/algorithmic nodes need formulaHint.

9. Create /src/data/populationBaseline.ts — 5-quarter rolling data from Phase 0F.

10. Initialize shadcn: npx shadcn@latest init
    Then add components: button card badge dialog tabs separator textarea

11. Create CLAUDE.md in project root with:
    - Stack: Next.js 14 App Router, TypeScript strict, Tailwind, LangGraph.js
    - Fonts: decided in Phase 2 UI interview — do not hardcode fonts yet
    - Animation: motion/react (NOT framer-motion), animejs v4 (NOT v3)
    - Colors: decided in Phase 2 UI interview — do not hardcode colors yet
    - ReactFlow: @xyflow/react v12 only
    - All node functions signature: async (state: BoardState, config: { runId: string })
      => Promise<Partial<BoardState>>
    - All prompts live in /src/lib/prompts/ as exported TypeScript strings
    - NOTE: UI_DECISIONS.md will be provided before Phase 2 begins — read it then

After each file: confirm the types are consistent with the PRD schema before moving on.
After all files: confirm cross-file type consistency — especially that SSEEvent types
reference the same field names as BoardState fields.
Do not begin any Phase 1 work until this confirmation is complete.
```

---

### 0-B › CODEX — Synthetic Scenario Data

> Run this in parallel with 0-A, or immediately after. No dependencies on 0-A
> other than the scenario type shape (which you can copy from the PRD directly).

```
Context: We are building SENTINEL, a multi-agent board intelligence demo for
financial institution executives. Read SENTINEL_PRD_v3.md before starting.

Task: Create /src/data/scenarios.ts with all three complete scenario objects.

Requirements:
- All financial figures must be realistic for a $2–5B community bank
- Use the exact field names and structure from Phase 0E of the PRD
- Scenario A (falcon-board): Full Board Q4 package. NIM compressed, one overdue MRA,
  CRE concentration breach, vendor data breach incident. Score: CRITICAL flags.
- Scenario B (audit-committee): Audit Committee mid-cycle. Two MRAs (one overdue),
  BSA finding, internal audit coverage table. No financial/capital data needed.
- Scenario C (risk-flash): Risk Committee flash. All metrics green. No open MRAs.
  No incidents. Minimal data — supervisor should route SKIP_HITL_COMPILE.

Use the exact figures from the PRD data layer spec section. Do not invent new ones.
Export as: export const SCENARIOS: ScenarioData[] = [...]
Export a helper: export function getScenario(id: string): ScenarioData

TypeScript types will come from /src/types/scenarios.ts — import from there.
If that file doesn't exist yet, inline the types locally and note it for reconciliation.
```

---

## PHASE 1 — LangGraph.js Orchestration

> Start Phase 1 only after Phase 0 is fully confirmed. 1-A through 1-C can run
> in parallel across Claude Code and Codex once Phase 1-A (the emitter) is done.

---

### 1-A › CLAUDE CODE — SSE Emitter + HITL Resolver

```
Read SENTINEL_PRD_v3.md. Read CLAUDE.md. Phase 0 is complete.

Task: Build the event emission and HITL pause/resume infrastructure.
This must be done before any node implementations, as all nodes depend on it.

1. Create /src/lib/eventEmitter.ts
   - In-memory Map<string, ReadableStreamDefaultController> for SSE controllers
   - registerController(runId, controller): void
   - emit(runId, event: SSEEvent): void — encodes as "data: {json}\n\n"
   - closeStream(runId): void
   - Separate Map<string, (decision: HITLDecision) => void> for HITL resolvers
   - registerHITLResolver(runId, resolve): void
   - resolveHITL(runId, decision): boolean — returns false if no resolver found
   - Export all functions as named exports

2. Create /src/app/api/stream/[runId]/route.ts
   - GET handler, Node.js runtime (export const runtime = 'nodejs')
   - Returns new Response(readableStream, headers)
   - Headers: Content-Type: text/event-stream, Cache-Control: no-cache,
     Connection: keep-alive, X-Accel-Buffering: no
   - Creates ReadableStream, registers controller via registerController
   - Keeps connection open — do not close until execution_complete event

3. Create /src/app/api/hitl/route.ts
   - POST handler
   - Body: { run_id: string, decision: 'approved' | 'revised', note?: string }
   - Calls resolveHITL(run_id, { decision, note })
   - Returns { status: 'resumed' } or { status: 'not_found' } if no resolver

Test: emit a test event manually and confirm it appears in EventSource in the browser
before proceeding to node implementations.
```

---

### 1-B › CLAUDE CODE — Meta-Agent + Dynamic Graph Builder

```
Read SENTINEL_PRD_v3.md. Read CLAUDE.md. Phase 1-A is complete.

Task: Build the meta-agent and the dynamic graph assembly function.
These are the two most critical pieces of the orchestration layer.

1. Create /src/lib/prompts/metaAgent.ts
   Export META_AGENT_PROMPT as a string. Use the exact system prompt from
   Phase 1B of the PRD. Inject NODE_REGISTRY node descriptions dynamically
   (the function should accept the registry and return the formatted prompt string).

2. Create /src/lib/graph/metaAgent.ts
   - Function: runMetaAgent(scenario: ScenarioData): Promise<MetaAgentResult>
   - MetaAgentResult: { topology: string[], rationale: string }
   - Makes one OpenAI call with JSON mode, temperature 0.0
   - Model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
   - Parses response, validates all returned node IDs exist in NODE_REGISTRY
   - FALLBACK: if API call fails or returns invalid node IDs, derive topology
     deterministically from scenario.expectedNodes — demo must always work offline
   - Emits no SSE events (caller is responsible for emitting graph_constructed)

3. Create /src/lib/graph/graph.ts
   - Function: buildGraph(topology: string[]): CompiledStateGraph
   - Uses StateGraph from @langchain/langgraph
   - Dynamically adds only the nodes present in topology
   - Adds edges based on adjacency in topology array
   - Adds conditional edges from 'supervisor' node using supervisorRouter function:
       PROCEED_TO_HITL → 'hitl_gate' (if in topology) else 'report_compiler'
       SKIP_HITL_COMPILE → 'report_compiler'
       LOOP_BACK → target node specified in supervisor output (max 2 loops)
       ESCALATE → 'report_compiler' with escalation flag set in state
   - Sets entry point to topology[0]
   - Sets finish point to 'report_compiler'
   - Returns compiled graph

4. Create an in-memory Map<string, CompiledStateGraph> to hold active graph
   instances per run_id (needed for HITL updateState call).
   Export: setActiveGraph(runId, graph), getActiveGraph(runId), clearActiveGraph(runId)

Do not implement individual node functions yet — those are separate tasks.
```

---

### 1-C › CODEX — Node Function Stubs (All 9 Nodes)

> Can run in parallel with 1-B. Stubs only — logic comes in 1-E.

```
Context: SENTINEL board intelligence demo. Read SENTINEL_PRD_v3.md.

Task: Create stub implementations for all 9 node functions in /src/lib/graph/nodes/

Each node file must:
- Export a named async function matching the node ID in camelCase
  e.g., financial_aggregator → financialAggregator
- Accept: (state: BoardState, config: RunnableConfig) => Promise<Partial<BoardState>>
- Import emit from '@/lib/eventEmitter'
- Import SSEEvent types from '@/types/events'
- Emit NODE_STARTED at the top with correct nodeId, nodeType, label, timestamp
- Emit NODE_COMPLETED at the bottom with a placeholder outputSummary
- Return an empty Partial<BoardState> for now (logic added in next task)
- Add a TODO comment: // TODO: implement [node name] logic — see PRD Phase 1C

Files to create:
- /src/lib/graph/nodes/financialAggregator.ts   (type: deterministic)
- /src/lib/graph/nodes/capitalMonitor.ts         (type: deterministic)
- /src/lib/graph/nodes/creditQuality.ts          (type: algorithmic)
- /src/lib/graph/nodes/trendAnalyzer.ts          (type: hybrid)
- /src/lib/graph/nodes/regulatoryDigest.ts       (type: llm)
- /src/lib/graph/nodes/operationalRisk.ts        (type: llm)
- /src/lib/graph/nodes/supervisor.ts             (type: orchestrator)
- /src/lib/graph/nodes/hitlGate.ts               (type: human)
- /src/lib/graph/nodes/reportCompiler.ts         (type: llm)

Also create /src/lib/graph/nodes/index.ts that exports a getNodeFunction(nodeId: string)
helper that returns the correct function for a given node ID string.
This is used by buildGraph() in graph.ts.
```

---

### 1-D › CODEX — System Prompts (All 6)

> Can run in parallel with 1-B and 1-C.

```
Context: SENTINEL board intelligence demo for CFO/CRO/board-level audiences at
community banks ($2–5B). Read SENTINEL_PRD_v3.md — specifically Phase 1C prompts
section and the node descriptions in Phase 0C.

Task: Create all 6 system prompt files in /src/lib/prompts/

Each file exports a single named constant (TypeScript string).

Files:
1. metaAgent.ts — already handled in 1-B, skip
2. regulatoryDigest.ts → export REGULATORY_DIGEST_PROMPT
3. operationalRisk.ts → export OPERATIONAL_RISK_PROMPT
4. supervisor.ts → export SUPERVISOR_PROMPT
5. reportCompiler.ts → export REPORT_COMPILER_PROMPT
6. trendAnalyzerNarrative.ts → export TREND_NARRATIVE_PROMPT

Requirements for each prompt:
- Persona is a specific professional role (BSA officer, CRO, senior analyst)
- All outputs are explicitly JSON (specify the exact schema in the prompt)
- No markdown in the JSON output instruction
- Include the word "community bank" in context setting
- Prompts must match the output schemas defined in /src/types/state.ts exactly
- Supervisor prompt must list all 4 routing decisions with exact string values:
  PROCEED_TO_HITL, SKIP_HITL_COMPILE, LOOP_BACK, ESCALATE
- Report compiler prompt must list all 7 sections in order with exact section IDs

These are string exports only — no API calls, no logic.
```

---

### 1-E › CLAUDE CODE — Node Logic Implementation

```
Read SENTINEL_PRD_v3.md. Read CLAUDE.md.
Stubs from 1-C are in place. Prompts from 1-D are in place.

Task: Implement full logic for all 9 nodes. Work through them in this order
(deterministic first, then algorithmic, then hybrid, then LLM):

GROUP 1 — Deterministic (no LLM, implement completely):
1. financialAggregator.ts
   - Calculate NIM/ROA/ROE variance: (actual - budget) / budget * 100
   - Flag NIM if variance < -5%, flag efficiency ratio if > 60%
   - RAG: 0 flags → green, 1 flag → amber, 2+ flags → red
   - Return complete FinancialMetrics object

2. capitalMonitor.ts
   - Compare each ratio to minimum and well-capitalized thresholds from PRD
   - Flag any ratio within 150bps of minimum
   - RAG: all above well-capitalized → green, approaching → amber, breach → red
   - Return complete CapitalMetrics object

3. creditQuality.ts
   - Implement weighted scoring algorithm exactly as specified in PRD Phase 1C
   - Weights: NPL vs peer (0.35), provision coverage (0.25), NCO trend (0.20),
     concentration breach (0.20)
   - Score → RAG: ≤ -2 red, -1 to 0 amber, ≥ 1 green
   - Return complete CreditMetrics with score, breakdown, RAG, flags

GROUP 2 — Hybrid:
4. trendAnalyzer.ts
   - Step 1 deterministic: simple linear regression slope for NIM, NPL, efficiency
     ratio using POPULATION_BASELINE data. Flag if slope > 1 std dev from mean.
   - Step 2 LLM (only if flags found): call OpenAI with TREND_NARRATIVE_PROMPT,
     inject the computed slopes and flagged metrics, get 2-3 sentence narrative
   - Return TrendAnalysis with both stats and narrative

GROUP 3 — LLM:
5. regulatoryDigest.ts — call OpenAI, JSON mode, REGULATORY_DIGEST_PROMPT
6. operationalRisk.ts — call OpenAI, JSON mode, OPERATIONAL_RISK_PROMPT
7. supervisor.ts — call OpenAI, JSON mode, SUPERVISOR_PROMPT, return decision
   + loopTarget + rationale. Emit EDGE_TRAVERSED event after decision.
8. reportCompiler.ts — call OpenAI, REPORT_COMPILER_PROMPT, build ReportDraft,
   convert to markdown, generate DOCX buffer, emit execution_complete event.

GROUP 4 — HITL:
9. hitlGate.ts — implement using LangGraph interrupt() pattern from PRD Phase 1C.
   Emit hitl_pause event before interrupt, hitl_resumed event after resume.
   Register HITL resolver so /api/hitl can resume execution.

For all LLM nodes:
- Model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
- Use response_format: { type: 'json_object' } for JSON mode
- Wrap in try/catch, emit error event on failure, return current state unchanged
- Log duration and include in NODE_COMPLETED event durationMs field
```

---

### 1-F › CLAUDE CODE — Analyze Route + End-to-End Test

```
Read SENTINEL_PRD_v3.md. Read CLAUDE.md.
All node implementations from 1-E are complete.

Task: Wire everything together and run a full end-to-end test.

1. Create /src/app/api/analyze/route.ts
   - POST handler, Node.js runtime
   - Body: { scenario_id: string }
   - Load scenario from SCENARIOS data
   - Initialize BoardState with scenario data, empty arrays, null fields
   - Run runMetaAgent(scenario) to get topology
   - Emit graph_constructed SSE event via eventEmitter
   - Build graph: buildGraph(topology)
   - Store in active graph map
   - Generate run_id (crypto.randomUUID())
   - Return { run_id, graph_topology, node_count } immediately (don't await execution)
   - Start graph execution asynchronously: graph.stream(initialState, config)
     Pipe stream events to SSE emitter

2. Test Scenario B (audit-committee) first — it has no HITL and only 5 nodes.
   Run npm run dev, POST to /api/analyze with scenario_id: 'audit-committee',
   then open /api/stream/{run_id} in browser and confirm all events fire in order.

3. Test Scenario C (risk-flash) — confirm graph compresses to 3 nodes and
   supervisor emits SKIP_HITL_COMPILE.

4. Test Scenario A (falcon-board) — confirm HITL pause fires, then manually
   POST to /api/hitl to resume, confirm execution completes and memo is generated.

Fix any issues before declaring Phase 1 complete.
```

---

### 1-G › CODEX — DOCX Generator

> Can run in parallel with 1-E after the ReportDraft type is confirmed from Phase 0.

```
Context: SENTINEL board intelligence demo. Read SENTINEL_PRD_v3.md Phase 1F.

Task: Create /src/lib/docx/generateBoardPackage.ts and /src/lib/docx/croweStyling.ts

Using the `docx` npm package (already installed), implement:

generateBoardPackageDOCX(reportDraft: ReportDraft, metadata: ReportMetadata): string
- Returns base64-encoded DOCX string
- Creates a Document with sections matching ReportDraft.sections in order
- Each section: heading + body paragraph(s)

croweStyling.ts — export style constants:
- HEADING_COLOR: '011E41'   (Crowe Indigo Dark — no # prefix for docx package)
- ACCENT_COLOR: 'F5A800'    (Crowe Amber)
- ALERT_COLOR: 'E5376B'     (Coral — for overdue MRA rows)
- BODY_FONT: 'Arial'        (Helvetica fallback)
- Document styles: heading 1 in indigo, heading 2 in amber, body in Arial 11pt
- Page header: '{institutionName} — Board Package | {date}'
- Page footer: 'Prepared by Crowe AI Innovation Team — CONFIDENTIAL'
- RAG table cells: green (#05AB8C tint), amber (#F5A800 tint), red (#E5376B tint)

The function must be importable in a Next.js API route (no browser globals).
Return base64 string using Buffer.from(await Packer.toBuffer(doc)).toString('base64')
```

---

## ⏸ PHASE 2 GATE — UI DECISIONS REQUIRED BEFORE BUILDING

> Phase 1 is complete and end-to-end tested.
> Before any Phase 2 code is written, run prompt 2-INTERVIEW below.
> The agent will produce a shopping list. You review it, make selections,
> and provide the results back as UI_DECISIONS.md in the project root.
> Only then do you run prompts 2-A onward.

---

### 2-INTERVIEW › CLAUDE CODE — Generate UI Shopping List

```
Read SENTINEL_PRD_v3.md. Read CLAUDE.md. Phase 1 is complete and tested.

DO NOT write any frontend code yet.

Task: Produce a UI shopping list for owner review and approval before Phase 2 begins.

The owner will make selections from this list, document them in UI_DECISIONS.md,
and return that file to you. You will read UI_DECISIONS.md at the start of every
Phase 2 prompt before writing any component code.

Generate the shopping list as a structured markdown document covering every
decision point below. For each item, provide:
- What it's used for in SENTINEL
- 2–3 specific options with install commands and a 1-line description
- Which option you recommend and why (be opinionated — owner may override)
- Whether this is a hard dependency or can be swapped for a simpler alternative

---

SECTION 1 — COLOR PALETTE & THEME

The base palette is Crowe brand (Indigo Dark #011E41, Amber #F5A800) — these are
locked. The decisions needed are:

1a. Surface hierarchy
    How many distinct surface levels do we need? Options:
    - 2 levels: background + card surface
    - 3 levels: background + card + elevated card
    - 4 levels: background + card + elevated + modal
    Recommend based on the 3-panel + HITL modal layout.

1b. Muted text color
    What color for secondary labels, timestamps, captions?
    Options: Crowe Cyan Light (#8FE1FF), a warm off-white, or a neutral grey tint.

1c. Node type colors
    The PRD proposes specific colors per node type. Confirm or suggest alternatives:
    - Deterministic: #0075C9 (Crowe Blue)
    - Algorithmic: #05AB8C (Crowe Teal)
    - LLM: #F5A800 (Crowe Amber)
    - Hybrid: #54C0E8 (Crowe Cyan)
    - Orchestrator: #B14FC5 (Crowe Violet)
    - Human/HITL: #E5376B (Crowe Coral)
    Are these visually distinct enough against the dark background? Suggest if not.

---

SECTION 2 — TYPOGRAPHY

2a. Display / heading font (used for node labels, metric values, section headings)
    Provide 3 options from Google Fonts that pair well with a dark financial dashboard.
    For each: name, weights needed, Google Fonts import snippet, one-line rationale.
    Flag if any have licensing restrictions for commercial use.

2b. Body / prose font (used for narratives, descriptions, log entries)
    Provide 3 options. Should be highly legible at 11–14px on dark backgrounds.

2c. Monospace font (used for scores, timestamps, state values)
    Provide 2 options. Should feel technical but not retro.

2d. Font pairing recommendation
    Given the C-suite demo context and Crowe brand, recommend one combination
    from the options above and explain why it works.

---

SECTION 3 — ANIMATED / INTERACTIVE COMPONENTS

For each component below, list the specific install command from 21st.dev or
React Bits, a screenshot description or link if available, and whether it requires
motion/react or has its own animation built in.

3a. Scenario selector cards (left panel)
    These need to feel premium — the presenter clicks one to load a scenario.
    Options:
    - React Bits SpotlightCard (cursor-following spotlight effect)
    - 21st.dev tilt card (3D mouse-tracking tilt)
    - Custom shadcn card with hover border animation (simpler, no extra install)
    Recommend one.

3b. Animated number display (credit score, metric values in Live State tab)
    Options:
    - React Bits CountUp (smooth count animation)
    - Anime.js v4 innerHTML tween (manual, no extra install)
    Recommend one. Note: CountUp is already in the install list.

3c. Background texture / atmosphere for the main canvas area
    The center graph canvas needs visual depth — not a flat solid color.
    Options:
    - React Bits Aurora (animated gradient mesh — install required)
    - React Bits Particles (floating dots — install required)
    - CSS radial gradient with noise texture (no install, pure CSS)
    - ReactFlow built-in dot grid (already available, minimal)
    Recommend one for a C-suite demo context (not too distracting).

3d. Text reveal animation for narration overlay cards
    When a narration card slides in, should the text animate?
    Options:
    - React Bits BlurText (word-by-word blur reveal)
    - React Bits SplitText (character-by-character split)
    - Simple motion/react fade (no extra install)
    Recommend one. Note: narration cards are short (1–2 sentences).

3e. Loading / thinking state for LLM nodes while they're active
    When an LLM node is executing, it needs a visual "thinking" indicator.
    Options:
    - Pulsing amber ring (CSS keyframe, no install)
    - Animated dots (CSS, no install)
    - React Bits aurora shimmer effect on node border
    Recommend one that reads clearly at the node scale (~160px wide).

3f. HITL modal entrance animation
    The CFO review modal is a dramatic pause moment. Should feel significant.
    Options:
    - Scale up from center (motion/react, no install)
    - Slide up from bottom (motion/react, no install)
    - Blur backdrop fade with card drop (motion/react, no install)
    Recommend one.

---

SECTION 4 — LAYOUT MICRO-DECISIONS

4a. Header height
    PRD specifies 64px. Confirm or adjust (48px / 64px / 80px).

4b. Left panel width
    PRD specifies 320px. Confirm or adjust based on scenario card content.

4c. Right panel width
    PRD specifies 380px. Confirm or adjust based on state inspector content density.

4d. Execution log footer height
    PRD specifies 120px. Confirm or adjust — needs to show full log entry card.

4e. Node card dimensions in ReactFlow
    Approximate width × height for each node card in the graph.
    Recommendation: 200px × 80px. Confirm or adjust.

4f. Graph canvas background
    Options: dark dot grid (ReactFlow built-in), no background, subtle crosshatch.

---

SECTION 5 — ICON LIBRARY

5a. Primary icon set
    PRD assumes Lucide React. Confirm or select alternative:
    - Lucide React (already in shadcn stack, clean outlines)
    - Phosphor Icons (more expressive, heavier)
    - Tabler Icons (very comprehensive, thin lines)
    Recommend one.

5b. Node type icons
    List the specific icon name you want for each node type from the chosen library:
    - Deterministic (rules engine): suggest Lucide `Settings2` or `GitBranch`
    - Algorithmic (ML scoring): suggest Lucide `BarChart3` or `TrendingUp`
    - LLM (AI agent): suggest Lucide `Bot` or `Sparkles`
    - Hybrid: suggest Lucide `Zap` or `Layers`
    - Orchestrator: suggest Lucide `Network` or `Shuffle`
    - Human/HITL: suggest Lucide `UserCheck` or `ShieldCheck`
    List your recommendation — owner will confirm or swap.

---

SECTION 6 — ADDITIONAL INSTALLS NEEDED

List every npm package or shadcn component that will be needed for Phase 2 that
is NOT already in the Phase 0 install list. Include exact install commands.
Flag any that may have corporate network SSL issues on Windows.

---

OUTPUT FORMAT:

Produce this as a clean markdown file the owner can read and annotate.
Use clear section headers. For each item, use this structure:

### [Item ID] — [Item Name]
**Used for:** [one line]
**Options:**
  A. [option] — `[install command if needed]` — [one-line description]
  B. [option] — `[install command if needed]` — [one-line description]
  C. [option] — (no install) — [one-line description]
**Recommendation:** [A/B/C] — [one sentence why]
**Owner selection:** [ leave blank — owner fills this in ]

After producing this document, STOP. Do not write any component code.
Wait for UI_DECISIONS.md to be provided before starting any Phase 2 task.
```

---

> **OWNER ACTION REQUIRED**
> The agent has produced a shopping list. Review each section, make your selections,
> and save your answers as `UI_DECISIONS.md` in the project root.
> Return to the agent with: "UI_DECISIONS.md is ready. Read it and begin 2-A."

---

## PHASE 2 — Frontend Build
*Start only after UI_DECISIONS.md is in the project root and confirmed.*

---

### 2-A › CLAUDE CODE — App Shell + Global Styles + Fonts

```
Read SENTINEL_PRD_v3.md. Read CLAUDE.md. Read UI_DECISIONS.md.
Phase 1 is complete. UI decisions have been made by the owner.

Task: Build the app shell — layout, global CSS, font setup, color tokens.
Use ONLY the fonts, colors, and decisions specified in UI_DECISIONS.md.
Do not default to Inter, Roboto, or any font not listed there.
This must be done before any component work.

1. /src/app/globals.css
   Implement CSS variables using the colors confirmed in UI_DECISIONS.md sections 1 and 1c.
   Base palette: --background #011E41, --accent #F5A800 (locked — Crowe brand).
   Surface levels, muted text, and node colors: from UI_DECISIONS.md.
   Add keyframes: node-glow-pulse (box-shadow animation for active nodes),
   edge-dot-travel (stroke-dashoffset for animated edges).
   Base: html/body background = var(--background), overflow hidden on body.

2. /src/app/layout.tsx
   Load fonts specified in UI_DECISIONS.md section 2d via next/font/google.
   Apply as CSS variables: --font-display, --font-body, --font-mono.
   Set html lang="en".

3. /src/app/page.tsx
   Three-panel layout from PRD Phase 2A with dimensions confirmed in UI_DECISIONS.md
   section 4. Fixed header, three columns, fixed footer. No page scroll.
   Placeholder divs with correct dimensions and background colors for each panel.

4. Install any additional packages listed in UI_DECISIONS.md section 6
   that are not already installed.

5. Install the React Bits / 21st.dev components selected in UI_DECISIONS.md section 3.
   Use the exact install commands from that document.

Confirm layout renders at 1920×1080 and 1440×900 before proceeding to 2-B.
```

---

### 2-B › CLAUDE CODE — ReactFlow Graph Canvas + Custom Nodes

```
Read SENTINEL_PRD_v3.md. Read CLAUDE.md. Read UI_DECISIONS.md. Phase 2-A is complete.

Task: Build the ReactFlow graph canvas and all custom node types.
Use the node colors, icons, and dimensions from UI_DECISIONS.md sections 1c, 4e, 5b.
Use the LLM thinking indicator selected in UI_DECISIONS.md section 3e.
Use the graph canvas background selected in UI_DECISIONS.md section 4f.

1. Create /src/components/GraphCanvas/GraphCanvas.tsx
   - Uses @xyflow/react (ReactFlow v12)
   - Registers all custom node types: deterministic, algorithmic, llm, hybrid,
     orchestrator, human (hitl)
   - Registers custom edge type: animatedEdge
   - Background: as specified in UI_DECISIONS.md 4f
   - Controls: hidden, MiniMap: hidden
   - fitView on graph change
   - Reads nodes/edges from Zustand executionStore

2. Create one component per node type using node colors and icons from UI_DECISIONS.md:
   DeterministicNode, AlgorithmicNode, LLMNode, HybridNode, OrchestratorNode, HITLNode

   All nodes share this structure:
   - Dimensions: as specified in UI_DECISIONS.md 4e
   - Container: rounded-xl, border-l-4 in node color, var(--surface) bg
   - Top row: node type icon (from UI_DECISIONS.md 5b) + badgeLabel uppercase tiny
   - Middle: node label in display font (from UI_DECISIONS.md 2d), text-white
   - Bottom: status dot

   State styles:
   - idle: opacity-40
   - active: full opacity + glow pulse in node color (node-glow-pulse keyframe)
     LLMNode: use thinking indicator from UI_DECISIONS.md 3e
   - completed: opacity-70, checkmark icon top-right
   - paused: coral pulse (HITLNode only) + "AWAITING REVIEW" badge

3. Create /src/components/GraphCanvas/AnimatedEdge.tsx
   SVG path with animated dot, edge label badge, conditional/loop edge variants.

4. Create /src/components/GraphCanvas/GraphLegend.tsx
   Node type legend, bottom-left of canvas, using colors from UI_DECISIONS.md 1c.

5. Create /src/components/GraphCanvas/MetaAgentReveal.tsx
   Pre-execution animation: overlay dims, violet orchestrator node appears center,
   annotation card with meta-agent rationale, node count badge, then graph assembles.
   Use motion/react AnimatePresence + stagger for graph construction animation.
```

---

### 2-C › CLAUDE CODE — Zustand Store + SSE Hook

```
Read SENTINEL_PRD_v3.md. Read CLAUDE.md. Read UI_DECISIONS.md.

Task: State management and SSE client.

1. Create /src/store/executionStore.ts
   Zustand store with:
   - selectedScenarioId: string | null
   - runId: string | null
   - isRunning: boolean
   - isPaused: boolean
   - graphNodes: ReactFlowNode[]
   - graphEdges: ReactFlowEdge[]
   - activeNodeId: string | null
   - nodeExecutionStates: Record<string, NodeExecutionState>
   - executionLog: ExecutionLogEntry[]
   - liveState: Partial<BoardState>
   - reportMarkdown: string | null
   - docxBuffer: string | null
   - hitlSummary: HITLPauseEvent['riskSummary'] | null
   - speed: 'slow' | 'normal' | 'fast'
   - Actions: setScenario, startRun, resetAll, setSpeed,
     handleSSEEvent, submitHITLDecision

   Speed → delayMs: slow=2000, normal=800, fast=150

2. Create /src/hooks/useSSE.ts
   EventSource to /api/stream/{runId}, parse + dispatch to store,
   retry 3x on error, cleanup on unmount.

3. Create /src/hooks/useGraphExecution.ts
   POST /api/analyze, receive run_id, trigger SSE connection.
   Returns { startExecution, isRunning, isPaused }

Wire GraphCanvas to executionStore. Confirm node states update on a test run.
```

---

### 2-D › CODEX — Left Panel (Scenario Cards + Run Controls)

```
Context: SENTINEL board intelligence demo.
Read SENTINEL_PRD_v3.md Phase 2C. Read CLAUDE.md. Read UI_DECISIONS.md.

Task: Build /src/components/ScenarioPanel/

Use the scenario card component selected in UI_DECISIONS.md section 3a.
Use the display font from UI_DECISIONS.md section 2d.
Use colors from UI_DECISIONS.md sections 1 and 1c.

Files:
1. ScenarioPanel.tsx — container, reads selectedScenarioId from Zustand

2. ScenarioCard.tsx
   Props: scenario (ScenarioData), isSelected: boolean, onSelect: () => void
   Use the card component from UI_DECISIONS.md 3a (exact install/import from that doc).
   Content: meetingType label (muted cyan, uppercase tiny), scenario.label (display font bold),
   badge: "{n} agents" + coral "HITL" badge if hitl_gate in expectedNodes.
   Selected state: amber left border (border-l-4 border-[#F5A800]).

3. RunControls.tsx
   - "Run Analysis" button: full width, amber bg (#F5A800), display font bold, text black
     Disabled + opacity-50 while isRunning
     Amber glow pulse (Anime.js v4 boxShadow loop) while idle:
     import { animate } from 'animejs'
     animate('.run-button', {
       boxShadow: ['0 0 0 0 rgba(245,168,0,0)', '0 0 0 12px rgba(245,168,0,0.3)', '0 0 0 0 rgba(245,168,0,0)'],
       duration: 2000, loop: true, ease: 'outQuad'
     })
   - Speed pills: Slow / Normal / Fast — active pill amber bg
   - Reset: ghost small button, calls store.resetAll()
```

---

### 2-E › CODEX — Right Panel (State Inspector + Report + Download)

```
Context: SENTINEL board intelligence demo.
Read SENTINEL_PRD_v3.md Phase 2D. Read CLAUDE.md. Read UI_DECISIONS.md.

Task: Build /src/components/StatePanel/

Use the animated number component from UI_DECISIONS.md section 3b.
Use fonts from UI_DECISIONS.md section 2d.

Files:
1. StatePanel.tsx — shadcn Tabs, three tabs: "Live State" | "Report" | "Download"

2. LiveStateTab.tsx
   Reads liveState from executionStore. Sections fade in as SSE events arrive.
   - Financial: NIM/ROA/ROE with RAG variance badges
   - Capital: thin progress bars vs thresholds
   - Credit score: animated number (UI_DECISIONS.md 3b) in SVG ring (stroke = RAG color)
   - RAG row: three colored dots labeled Financial / Capital / Credit
   Each section: motion/react initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
   Only renders when state field is non-null.

3. ReportPreviewTab.tsx
   Blank until execution_complete. Renders sections as structured HTML:
   - Heading: display font bold, amber underline (border-b-2 border-[#F5A800])
   - Body: body font, muted text color from UI_DECISIONS.md 1b
   - Overflow-y: auto. Staggered fade-in with motion/react AnimatePresence.

4. DownloadTab.tsx
   Disabled until docxBuffer is non-null.
   - "Download DOCX" — amber button, file-saver Blob download
   - "Copy Markdown" — ghost button, clipboard copy
   Status: "Generating..." while running, "Ready" on complete.
```

---

### 2-F › CODEX — HITL Modal

```
Context: SENTINEL board intelligence demo.
Read SENTINEL_PRD_v3.md Phase 2E. Read CLAUDE.md. Read UI_DECISIONS.md.

Task: Build /src/components/HITLModal/HITLModal.tsx

Use the entrance animation selected in UI_DECISIONS.md section 3f.
Fires when executionStore.isPaused === true and hitlSummary is non-null.

Layout (full-screen overlay):
- Backdrop: fixed inset-0, bg-black/70, backdrop-blur-sm
- Card: centered, max-w-2xl, bg surface color (UI_DECISIONS.md 1a), rounded-2xl, p-8
- Header: "⚠️ CFO REVIEW REQUIRED" — display font bold, coral (#E5376B)
  Sub: "Execution paused — board package ready for review" — body font, muted

- RAG grid (3 cols): Financial / Capital / Credit with colored dots
- Key flags list (hitlSummary.keyFlags): amber dot bullets
- Stat chips: open MRA count, overdue count
- Textarea (shadcn): "Add a note for the record..."
- Buttons:
  "Approve — Compile Final Package" — amber fill, display font bold
  "Escalate to Board" — coral outline

Entrance animation from UI_DECISIONS.md 3f using motion/react AnimatePresence.
On decision: POST to /api/hitl, close modal on response.
```

---

### 2-G › CODEX — Execution Log Footer

```
Context: SENTINEL board intelligence demo.
Read SENTINEL_PRD_v3.md Phase 2F. Read CLAUDE.md. Read UI_DECISIONS.md.

Task: Build /src/components/ExecutionLog/

Use fonts and colors from UI_DECISIONS.md. Use icon library from UI_DECISIONS.md 5a.

Files:
1. ExecutionLog.tsx
   Height: from UI_DECISIONS.md 4d. overflow-x: auto, flex-row gap-3.
   Reads executionLog from executionStore.
   motion/react AnimatePresence — new entries slide in from right.

2. ExecutionLogEntry.tsx
   Props: entry: ExecutionLogEntry
   Card (min-w-[240px], var(--surface) bg, rounded-lg, p-3):
   - Timestamp: mono font, 11px, muted — from UI_DECISIONS.md fonts
   - Node label: display font, 13px, white
   - outputSummary: body font, 11px, muted — truncate 60 chars
   - Left border: node type color from UI_DECISIONS.md 1c

   Special:
   - HITL: dark red bg, coral border, pause icon
   - Loop: coral dashed border, "↩ Loop {n}" coral badge

   Animation: motion/react initial={{opacity:0, x:40}} animate={{opacity:1, x:0}}
```

---

## PHASE 3 — Dynamic Graph Secret Sauce

> Start after all Phase 2 prompts pass visual review.

---

### 3-A › CLAUDE CODE — Scenario Switch + Graph Rebuild Animation

```
Read SENTINEL_PRD_v3.md Phase 3A and 3B. Read CLAUDE.md. Read UI_DECISIONS.md.

Task: Implement live graph rebuild on scenario switch + comparison mode.

1. Scenario switch:
   When setScenario called while isRunning:
   - isRunning=false, clear run
   - Graph fades out (motion/react AnimatePresence exit)
   - After 400ms: fire new /api/analyze
   - MetaAgentReveal plays again
   - Annotation: "Switching from {n}-node {old} to {m}-node {new}"

2. Comparison mode (header toggle "Compare Scenarios"):
   Two ReactFlow instances side by side.
   Left: falcon-board, Right: risk-flash. Both run simultaneously.
   Banner: "Same system. Different meeting. Minimum viable intelligence."

3. Graph diff panel (collapsible, bottom of canvas):
   Two columns: SELECTED (✓) and NOT REQUIRED (✗).
   Diff topology vs full NODE_REGISTRY.
```

---

### 3-B › CODEX — Narration Overlays + Keyboard Shortcuts

```
Context: SENTINEL board intelligence demo.
Read SENTINEL_PRD_v3.md Phase 4A and 4B. Read CLAUDE.md. Read UI_DECISIONS.md.

Task: Presentation mode polish.

1. /src/components/NarrationOverlay/NarrationOverlay.tsx
   Use text animation from UI_DECISIONS.md section 3d.
   Small card, slides in from bottom-right, auto-dismisses 4s.
   motion/react AnimatePresence.

   Triggers (from executionLog):
   - financial_aggregator completed: "This node runs pure arithmetic — no AI.
     NIM variance and efficiency ratios are deterministic calculations."
   - credit_quality completed: "Credit health scored using a weighted algorithm.
     Weights are hardcoded and auditable."
   - supervisor LOOP_BACK: "Supervisor re-routing to {node} for deeper analysis.
     Loop {n} of 2."
   - hitl_gate started: "Execution paused. CFO approval required before compilation."
   - risk-flash SKIP_HITL_COMPILE: "All metrics green. Compiling in {n} nodes
     instead of 8."
   - execution_complete: "Package complete. {n} agents, {ms}ms total."

2. Keyboard shortcuts (useEffect in page.tsx):
   Space=run, R=reset, 1/2/3=scenarios, S/N/F=speed, C=compare
   Shortcut legend on hover of ⌨ icon in header.
```

---

## FINAL — Pre-Deploy

---

### FINAL-A › CLAUDE CODE — Integration Test + Deploy

```
Read SENTINEL_PRD_v3.md checklist. Read CLAUDE.md. Read UI_DECISIONS.md.

Test order:
1. Scenario C — 3 nodes, no HITL, DOCX generates
2. Scenario B — 5 nodes, escalation path, DOCX generates
3. Scenario A — 8 nodes, HITL fires + resumes, supervisor loops, DOCX generates

Visual: 1920×1080 and 1440×900. No overflow. Legend visible. Log scrolls.

Deploy:
gh repo create achyuthrachur/sentinel-board-demo --public --source=. --remote=origin --push
Import at vercel.com/new → add OPENAI_API_KEY → Deploy
Post-deploy: smoke test all 3 scenarios. Lighthouse > 85 performance, > 90 accessibility.
```

---

*SENTINEL Agent Kickoff Prompts | Crowe AI Innovation Team | March 2026*
*Companion to SENTINEL_PRD_v3.md — use together*
