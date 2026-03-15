# SENTINEL — UI Shopping List
## Owner review required before Phase 2 begins

> Review each section. Make your selections in the **Owner selection** field.
> Save your final answers as `UI_DECISIONS.md` in the project root.
> Return to Claude Code with: "UI_DECISIONS.md is ready. Read it and begin 2-A."

> **Note on pre-selections:** Phase 0-A CLAUDE.md already specifies Syne + IBM Plex Sans + IBM Plex Mono and a full color token set. These are treated as the recommended defaults in sections 1 and 2. Override freely.

---

## SECTION 1 — COLOR PALETTE & THEME

### 1a — Surface Hierarchy
**Used for:** Distinguishing the three panels, node cards, modals, and tooltips on the dark background.

**Options:**
  A. 2 levels — `(no install)` — `--background #011E41` + `--surface #002E62`. Simple, easy to maintain.
  B. 3 levels — `(no install)` — `--background #011E41` + `--surface #002E62` + `--surface-raised #003F9F`. Allows node cards to lift above panel backgrounds.
  C. 4 levels — `(no install)` — adds `--surface-modal` (~`#001A38` overlay) for the HITL modal backdrop card.

**Recommendation:** B — The 3-panel + HITL modal layout needs at least 3 levels. Panel backgrounds sit on `--background`, node cards and right-panel sections sit on `--surface`, and hover/expanded states use `--surface-raised`. A fourth level would be redundant given the modal uses a full-screen overlay approach.

**Owner selection:** ___

---

### 1b — Muted Text Color
**Used for:** Secondary labels, timestamps in the execution log, metric captions, node descriptions.

**Options:**
  A. Crowe Cyan Light `#8FE1FF` — `(no install)` — Warm blue-tinted, pairs naturally with the indigo background. Already in CLAUDE.md as `--text-muted`.
  B. Warm off-white `#C8D4E8` — `(no install)` — Neutral, slightly cooler, high readability at small sizes.
  C. Neutral grey tint `#7A8FA6` — `(no install)` — Lower contrast, more subdued — risk of illegibility at 11px.

**Recommendation:** A — `#8FE1FF` has a deliberate on-brand warm-cyan feel that contrasts well against `#011E41` without competing with the amber accent. It's already established in the token set.

**Owner selection:** ___

---

### 1c — Node Type Colors
**Used for:** Left border, icon color, glow pulse, and badge background for each node card type in the ReactFlow canvas.

**Options (confirm PRD colors or override):**

| Node Type | Proposed Color | Hex | Visually distinct on dark bg? |
|-----------|---------------|-----|-------------------------------|
| Deterministic (Rules Engine) | Crowe Blue | `#0075C9` | Yes — strong midtone blue |
| Algorithmic (ML Scoring) | Crowe Teal | `#05AB8C` | Yes — distinct from blue |
| LLM (AI Agent) | Crowe Amber | `#F5A800` | Yes — high contrast, warm |
| Hybrid | Crowe Cyan | `#54C0E8` | Yes — distinct from teal |
| Orchestrator | Crowe Violet | `#B14FC5` | Yes — unique in the set |
| Human/HITL | Crowe Coral | `#E5376B` | Yes — urgency/danger signal |

All 6 colors are visually distinct against `#011E41` with adequate luminance contrast (WCAG AA at their badge scale). The set passes the "glance test" — a viewer can distinguish node types without reading labels.

**Recommendation:** Confirm all 6 as-is. No alternatives needed.

**Owner selection (confirm or override each):**
- Deterministic: ___
- Algorithmic: ___
- LLM: ___
- Hybrid: ___
- Orchestrator: ___
- Human/HITL: ___

---

## SECTION 2 — TYPOGRAPHY

### 2a — Display / Heading Font
**Used for:** Node labels, metric values (NIM 3.21%), section headings in the report preview, scenario card titles, HITL modal headline.

**Options:**

  A. **Syne** (700, 800) — `next/font/google: Syne` — Geometric, bold, engineered feel. Strong at large sizes. Excellent dark-bg legibility. Already pre-selected in CLAUDE.md. Free / OFL license.

  B. **Space Grotesk** (500, 700) — `next/font/google: Space_Grotesk` — Tech-adjacent, slightly warmer than Syne. Popular in fintech dashboards. Free / OFL.

  C. **DM Sans** (600, 700) — `next/font/google: DM_Sans` — Neutral, highly legible, less "editorial" than Syne. More conservative choice for a C-suite audience.

**Recommendation:** A (Syne) — Its compressed geometric forms read authority and precision at the metric-value scale (large bold numbers). It signals "this is a designed system" without feeling frivolous.

**Owner selection:** ___

---

### 2b — Body / Prose Font
**Used for:** LLM-generated narratives in the right panel, node descriptions, execution log summaries, HITL modal body text, report preview prose.

**Options:**

  A. **IBM Plex Sans** (400, 500) — `next/font/google: IBM_Plex_Sans` — Designed for dashboards and technical contexts. Excellent legibility at 12–14px on dark. Pre-selected in CLAUDE.md. Free / OFL.

  B. **Inter** (400, 500) — `next/font/google: Inter` — Industry default, extremely legible. Safe but generic. CLAUDE.md explicitly says NEVER use Inter.

  C. **Plus Jakarta Sans** (400, 500) — `next/font/google: Plus_Jakarta_Sans` — Warm, approachable, modern. Slightly more personality than IBM Plex Sans.

**Recommendation:** A (IBM Plex Sans) — The "IBM" provenance signals data infrastructure to a financial audience, and it renders exceptionally well at small sizes on dark backgrounds. Note that Inter is excluded per CLAUDE.md.

**Owner selection:** ___

---

### 2c — Monospace Font
**Used for:** Credit scores, timestamps in the execution log footer, RAG status values, state field keys in the live state inspector.

**Options:**

  A. **IBM Plex Mono** (400, 500) — `next/font/google: IBM_Plex_Mono` — Pairs perfectly with IBM Plex Sans body. Technical but not retro. Pre-selected in CLAUDE.md. Free / OFL.

  B. **JetBrains Mono** (400, 500) — `next/font/google: JetBrains_Mono` — More developer-coded feel. High legibility. Slightly more "hacker" aesthetic.

**Recommendation:** A (IBM Plex Mono) — Cohesion with the IBM Plex Sans body font creates a unified typographic system. The two weights (400/500) cover timestamps vs. highlighted values.

**Owner selection:** ___

---

### 2d — Font Pairing Recommendation
**Used for:** Confirming the full combination before wiring `next/font/google` in layout.tsx.

**Recommendation:** **Syne (display) + IBM Plex Sans (body) + IBM Plex Mono (mono)**

Rationale: Syne provides headline drama appropriate for a C-suite demo. IBM Plex Sans and Mono form a technically credible pair that signals "this was built by engineers who think about design." The contrast between Syne's geometric boldness and Plex's quiet rationality mirrors the contrast between the orchestration intelligence layer and the deterministic rules engine layer — which is the product's core narrative.

**Owner selection (confirm or specify alternative combination):** ___

---

## SECTION 3 — ANIMATED / INTERACTIVE COMPONENTS

### 3a — Scenario Selector Cards (Left Panel)
**Used for:** The 3 scenario cards in the left panel that the presenter clicks to load a scenario.

**Options:**

  A. **React Bits SpotlightCard** — `npx shadcn@latest add "https://21st.dev/r/DavidHDev/spotlight-card"` — Cursor-following radial spotlight effect on hover. Subtle, premium feel. Requires `motion/react` (already installed).

  B. **21st.dev Tilt Card** — `npx shadcn@latest add "https://21st.dev/r/aceternity/3d-tilt-card"` — 3D mouse-tracking perspective tilt. Very striking but can feel excessive at small card scale.

  C. **Custom shadcn Card with hover border animation** — `(no install)` — Amber border-l-4 on hover/selected, `motion/react` scale(1.01) on hover. Simple, reliable, zero install risk.

**Recommendation:** A (SpotlightCard) — The spotlight effect reads as intentional and premium at the 320px panel width. It provides interactive feedback without the disorientation of full 3D tilt. Works well with the dark `--surface` background. If the SSL/npm install is blocked by corporate proxy, fall back to C.

**Owner selection:** ___

---

### 3b — Animated Number Display
**Used for:** Credit health score (large number in SVG ring), NIM/ROA/ROE values fading in as SSE events arrive in the Live State tab.

**Options:**

  A. **React Bits CountUp** — `npx shadcn@latest add "https://21st.dev/r/reactbits/count-up"` — Smooth count animation with configurable easing. Handles decimal places.

  B. **Anime.js v4 innerHTML tween** — `(no install — animejs already installed)` — Manual: `animate(el, { innerHTML: [0, targetValue], duration: 1200, ease: 'outExpo', round: 100 })`. Full control, no extra install.

**Recommendation:** B (Anime.js v4 tween) — animejs v4 is already installed. The tween approach gives precise control over decimal rounding (important for NIM = "3.21%" not "3.2099999%"). Avoids another corporate SSL install. Use `round: 100` for 2 decimal places.

**Owner selection:** ___

---

### 3c — Background Texture / Atmosphere (Graph Canvas)
**Used for:** Visual depth on the center ReactFlow canvas background — must not distract from the graph nodes.

**Options:**

  A. **React Bits Aurora** — `npx shadcn@latest add "https://21st.dev/r/reactbits/aurora"` — Animated gradient mesh. Very visual, could compete with node colors.

  B. **React Bits Particles** — `npx shadcn@latest add "https://21st.dev/r/reactbits/particles"` — Floating dot particles. Subtle at low opacity. Install required.

  C. **CSS radial gradient + noise texture** — `(no install)` — `radial-gradient(ellipse at 30% 40%, rgba(0,75,201,0.15), transparent 60%)` layered with an SVG noise filter. Static, zero distraction.

  D. **ReactFlow dot grid** — `(no install, built-in)` — `<Background variant="dots" gap={24} size={1} color="rgba(255,255,255,0.06)" />`. Clean, reads as a precision instrument.

**Recommendation:** D (ReactFlow dot grid) — For a C-suite demo, the graph IS the hero. Any ambient animation competes with the node state animations and execution pulse effects. The dot grid provides spatial depth at zero distraction cost, and it's already available with no install.

**Owner selection:** ___

---

### 3d — Text Reveal Animation (Narration Overlay Cards)
**Used for:** When a narration card slides in during execution (e.g., "This node runs pure arithmetic — no AI."), the text entrance animation.

**Options:**

  A. **React Bits BlurText** — `npx shadcn@latest add "https://21st.dev/r/reactbits/blur-text"` — Word-by-word blur-to-sharp reveal. Premium feel. Install required.

  B. **React Bits SplitText** — `npx shadcn@latest add "https://21st.dev/r/reactbits/split-text"` — Character-by-character stagger. More dramatic, longer for a full sentence.

  C. **motion/react fade** — `(no install)` — `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}`. Instant readability, no extra complexity.

**Recommendation:** C (motion/react fade) — Narration cards contain 1–2 sentences that need to be read quickly during a live demo. BlurText and SplitText look beautiful but they delay readability. A clean 300ms fade prioritizes comprehension. The card's slide-in motion (from bottom-right) provides enough animation drama.

**Owner selection:** ___

---

### 3e — LLM Node "Thinking" Indicator
**Used for:** Visual indicator on LLM node cards (`regulatory_digest`, `operational_risk`, `supervisor`, `report_compiler`) while they are in `active` state awaiting OpenAI response.

**Options:**

  A. **Pulsing amber ring (CSS keyframe)** — `(no install)` — `box-shadow: 0 0 0 0 rgba(245,168,0,0.4)` → `0 0 20px 4px rgba(245,168,0,0)`. 1.5s infinite. Reads clearly at 200px node width.

  B. **Animated dots (CSS)** — `(no install)` — Three dots below the node label, staggered opacity pulse. Universally understood "loading" pattern.

  C. **Aurora shimmer on node border** — `npx shadcn@latest add "https://21st.dev/r/reactbits/aurora"` — Animated gradient border. Requires install, heavier.

**Recommendation:** A (pulsing amber ring) — Amber pulse on the active LLM node uses the accent color deliberately: it signals "AI is working here" in the brand's primary action color. It reads clearly at node scale and is visually distinct from the `completed` state. No install required.

**Owner selection:** ___

---

### 3f — HITL Modal Entrance Animation
**Used for:** The CFO review modal appearing when `hitl_gate` node pauses execution. This is the demo's dramatic pause moment.

**Options:**

  A. **Scale up from center** — `(no install, motion/react)` — `initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}`. Clean, focused.

  B. **Slide up from bottom** — `(no install, motion/react)` — `initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}`. Feels like an alert rising from below.

  C. **Blur backdrop fade with card drop** — `(no install, motion/react)` — Backdrop fades in first (200ms), then card drops in with `y: -20 → 0` and `opacity: 0 → 1` (300ms delay). Creates a two-beat dramatic entrance.

**Recommendation:** C (blur backdrop fade with card drop) — The two-beat timing makes the HITL moment feel genuinely weighty. The backdrop appearing first gives the audience a moment to register "something significant is happening" before the card arrives. The drop direction (from slightly above) reads as "authority descending."

**Owner selection:** ___

---

## SECTION 4 — LAYOUT MICRO-DECISIONS

### 4a — Header Height
**Used for:** Fixed top bar with logo, scenario name, and status indicator.

**Options:** 48px / **64px (PRD default)** / 80px

**Recommendation:** 64px — Sufficient for the Crowe logo + scenario label + status badge at comfortable padding. 48px feels cramped for a C-suite demo on a 27" monitor.

**Owner selection:** ___

---

### 4b — Left Panel Width
**Used for:** Scenario selector cards (3 cards) + Run Controls button.

**Options:** 280px / **320px (PRD default)** / 360px

**Recommendation:** 320px — Scenario cards need ~280px for the title + badge row. 320px gives comfortable 20px horizontal padding on each side.

**Owner selection:** ___

---

### 4c — Right Panel Width
**Used for:** Live State / Report Preview / Download tabs.

**Options:** 340px / **380px (PRD default)** / 420px

**Recommendation:** 380px — The Live State tab displays metric rows (label + value + variance badge). 380px fits `NIM | 3.21% | ▼ −0.23%` without truncation at 14px body font. 420px eats too much of the graph canvas.

**Owner selection:** ___

---

### 4d — Execution Log Footer Height
**Used for:** Horizontally-scrolling execution log cards at the bottom of the screen.

**Options:** 96px / **120px (PRD default)** / 148px

**Recommendation:** 120px — Fits a full log entry card: timestamp (11px) + node label (13px) + summary (11px) + 16px padding top/bottom. 96px clips the summary line.

**Owner selection:** ___

---

### 4e — Node Card Dimensions (ReactFlow)
**Used for:** All custom node cards in the graph canvas.

**Options:** 160×64px / **200×80px (recommended)** / 240×96px

**Recommendation:** 200×80px — Sufficient for: top row (icon + badge, 24px), label row (20px), status row (16px), with 10px vertical padding. At 160px wide, `ORCHESTRATOR` badge gets truncated. At 240px, a 5-node graph feels oversized on 1440px canvas.

**Owner selection:** ___

---

### 4f — Graph Canvas Background
**Used for:** The background texture/grid of the center ReactFlow canvas.

*This is answered by Section 3c above (recommendation: ReactFlow dot grid).*

**Owner selection:** ___ *(confirm or specify — see 3c)*

---

## SECTION 5 — ICON LIBRARY

### 5a — Primary Icon Set
**Used for:** All icons in the app: node type indicators, tab icons, button icons, status dots, HITL modal icons.

**Options:**

  A. **Lucide React** — `(already in shadcn stack)` — Clean, consistent stroke-width. 1200+ icons. Default for shadcn/ui.
  B. **Phosphor Icons** — `npm install @phosphor-icons/react` — More expressive, 6 weight variants. Heavier bundle.
  C. **Tabler Icons** — `npm install @tabler/icons-react` — 4000+ icons, thin lines, comprehensive.

**Recommendation:** A (Lucide React) — Already installed as shadcn dependency. Consistent 1.5px stroke weight matches the dashboard aesthetic. The specific icons needed below are all available.

**Owner selection:** ___

---

### 5b — Node Type Icons (Lucide)
**Used for:** Top-left icon on each node card in the ReactFlow canvas.

| Node Type | Recommended Icon | Rationale |
|-----------|-----------------|-----------|
| Deterministic (Rules Engine) | `Settings2` | Gears = configured rules |
| Algorithmic (ML Scoring) | `BarChart3` | Statistical output |
| LLM (AI Agent) | `Sparkles` | AI inference |
| Hybrid | `Layers` | Stacked method layers |
| Orchestrator | `Network` | Graph topology control |
| Human/HITL | `UserCheck` | Human approval action |

**Recommendation:** Confirm all 6 above. All available in Lucide React v0.x+.

**Owner selection (confirm or swap each):**
- Deterministic: ___
- Algorithmic: ___
- LLM: ___
- Hybrid: ___
- Orchestrator: ___
- Human/HITL: ___

---

## SECTION 6 — ADDITIONAL INSTALLS FOR PHASE 2

Packages NOT in the Phase 0 install list that may be needed:

| Package | Install Command | Purpose | SSL Risk? |
|---------|----------------|---------|-----------|
| `lucide-react` | `npm install lucide-react` | Node type icons (see 5a) | Low — npm registry |
| `clsx` + `tailwind-merge` | Already installed by shadcn | Class utilities | Already done |
| SpotlightCard (if selected in 3a) | `NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/DavidHDev/spotlight-card"` | Scenario card effect | **Medium — corporate SSL may block** |
| React Bits BlurText (if selected in 3d) | `NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/reactbits/blur-text"` | Narration text reveal | **Medium — corporate SSL may block** |
| React Bits CountUp (if selected in 3b) | `NODE_TLS_REJECT_UNAUTHORIZED=0 npx shadcn@latest add "https://21st.dev/r/reactbits/count-up"` | Metric number animation | **Medium — corporate SSL may block** |

> **SSL note:** All `21st.dev` registry installs require the `NODE_TLS_REJECT_UNAUTHORIZED=0` workaround on this machine (confirmed during Phase 0 shadcn init). This is safe for dev installs only — never use in production CI.

> **If all animated component installs are blocked:** The entire Phase 2 animation layer can be implemented with `motion/react` + `animejs` (both already installed). Sections 3a→C, 3b→B, 3d→C, 3e→A, 3f→C are all zero-install alternatives.

---

## OWNER ACTIONS

1. Fill in all **Owner selection** fields above
2. Save this file as `UI_DECISIONS.md` in the project root (or create a new `UI_DECISIONS.md` with just your selections)
3. Return to Claude Code with: **"UI_DECISIONS.md is ready. Read it and begin 2-A."**

---

*SENTINEL UI Shopping List | Crowe AI Innovation Team | Generated 2026-03-13*
*Do not begin Phase 2 code until owner selections are confirmed.*
