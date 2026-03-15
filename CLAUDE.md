# SENTINEL — Claude Code Instructions

## Stack
- Next.js 14 App Router (src/ directory)
- TypeScript strict mode
- Tailwind CSS
- LangGraph.js (@langchain/langgraph) — orchestration runs in Route Handlers (Node.js runtime)
- @xyflow/react v12 — ReactFlow graph canvas
- Zustand — client state
- shadcn/ui — components

## Fonts (NEVER use Inter or Roboto)
- Display: Syne (700, 800)
- Body: IBM Plex Sans (400, 500)
- Mono: IBM Plex Mono

## Animation
- motion/react (NOT framer-motion)
- animejs v4 only (NOT v3 — v4 is a complete rewrite)

## Color Tokens (CSS custom properties on :root)
- --background: #011E41 (Crowe Indigo Dark)
- --surface: #002E62
- --surface-raised: #003F9F
- --accent: #F5A800 (Crowe Amber)
- --accent-bright: #FFD231
- --teal: #05AB8C
- --cyan: #54C0E8
- --coral: #E5376B
- --violet: #B14FC5
- --text-primary: #FFFFFF
- --text-muted: #8FE1FF
- --border: rgba(255,255,255,0.08)
- --border-active: rgba(245,168,0,0.4)

## Node Function Signature (ALL 9 node functions)
async (state: BoardState, config: RunnableConfig) => Promise<Partial<BoardState>>
config.configurable?.runId extracts the run ID

## Prompts
All system prompts live in /src/lib/prompts/ as exported TypeScript strings (not separate .txt files)

## Key Files
- /src/lib/graph/state.ts — BoardStateAnnotation (source of truth for BoardState type)
- /src/types/ — all interfaces (import from here, not from state.ts)
- /src/data/nodeRegistry.ts — NODE_REGISTRY (10 nodes)
- /src/data/populationBaseline.ts — 5-quarter trend data
