import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react';
import type { NodeExecutionState } from '@/types/graph';
import type {
  GraphConstructedEvent,
  EdgeDef,
  SSEEvent,
} from '@/types/events';
import type {
  ExecutionLogEntry,
  HITLSummary,
  NodeType,
  ReportSection,
} from '@/types/state';
import type { BoardState } from '@/lib/graph/state';
import { NODE_REGISTRY } from '@/data/nodeRegistry';

// ─── Speed mapping ────────────────────────────────────────────────────────────

export const SPEED_DELAY: Record<'slow' | 'normal' | 'fast', number> = {
  slow:   2000,
  normal:  800,
  fast:    150,
};

// ─── Layout ──────────────────────────────────────────────────────────────────

const NODE_W = 210;
const NODE_H = 100;
const COL_GAP = 100;
const ROW_GAP = 28;

export function computeLayout(
  nodeIds: string[],
  edges: EdgeDef[],
): Map<string, { x: number; y: number }> {
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  nodeIds.forEach((id) => {
    inDegree.set(id, 0);
    outEdges.set(id, []);
  });

  edges.forEach((e) => {
    if (nodeIds.includes(e.source) && nodeIds.includes(e.target)) {
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
      outEdges.get(e.source)?.push(e.target);
    }
  });

  const ranks = new Map<string, number>();
  const queue = nodeIds.filter((id) => (inDegree.get(id) ?? 0) === 0);
  queue.forEach((id) => ranks.set(id, 0));

  let frontier = [...queue];
  const visited = new Set<string>();
  while (frontier.length > 0) {
    const next: string[] = [];
    frontier.forEach((id) => {
      if (visited.has(id)) return;
      visited.add(id);
      outEdges.get(id)?.forEach((target) => {
        const rank = Math.max(ranks.get(target) ?? 0, (ranks.get(id) ?? 0) + 1);
        ranks.set(target, rank);
        next.push(target);
      });
    });
    frontier = next;
  }

  nodeIds.forEach((id) => {
    if (!ranks.has(id)) ranks.set(id, 0);
  });

  const rankGroups = new Map<number, string[]>();
  ranks.forEach((rank, id) => {
    if (!rankGroups.has(rank)) rankGroups.set(rank, []);
    rankGroups.get(rank)!.push(id);
  });

  const positions = new Map<string, { x: number; y: number }>();
  rankGroups.forEach((ids, rank) => {
    const totalH = ids.length * NODE_H + (ids.length - 1) * ROW_GAP;
    const startY = -totalH / 2;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: rank * (NODE_W + COL_GAP),
        y: startY + i * (NODE_H + ROW_GAP),
      });
    });
  });

  return positions;
}

// ─── Column layout (for parallel topology preview + execute graph) ────────────

export function computeColumnLayout(
  visualColumns: string[][],
  nodeW = 210,
  nodeH = 100,
  colGap = 100,
  rowGap = 28,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  visualColumns.forEach((column, colIdx) => {
    const totalH = column.length * nodeH + (column.length - 1) * rowGap;
    const startY = -totalH / 2;
    column.forEach((nodeId, rowIdx) => {
      positions.set(nodeId, {
        x: colIdx * (nodeW + colGap),
        y: startY + rowIdx * (nodeH + rowGap),
      });
    });
  });
  return positions;
}

// ─── Type mapping ─────────────────────────────────────────────────────────────

const NODE_TYPE_MAP: Record<NodeType, string> = {
  deterministic: 'deterministicNode',
  algorithmic:   'algorithmicNode',
  hybrid:        'hybridNode',
  llm:           'llmNode',
  orchestrator:  'orchestratorNode',
  human:         'hitlNode',
};

export function buildRFNodes(
  nodeIds: string[],
  positions: Map<string, { x: number; y: number }>,
): Node[] {
  return nodeIds.reduce<Node[]>((acc, id) => {
    const meta = NODE_REGISTRY[id];
    if (!meta) return acc;
    const pos = positions.get(id) ?? { x: 0, y: 0 };
    acc.push({
      id,
      type: NODE_TYPE_MAP[meta.type] ?? 'deterministicNode',
      position: pos,
      data: { ...meta, executionState: 'idle' as NodeExecutionState },
    });
    return acc;
  }, []);
}

export function buildRFEdges(edges: EdgeDef[]): Edge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'animatedEdge',
    label: e.label ?? '',
    data: { edgeType: e.type },
  }));
}

// ─── Store types ──────────────────────────────────────────────────────────────

export interface SwitchAnnotation {
  fromLabel: string;
  fromCount: number;
  toLabel: string;
}

export type AppPhase = 'configure' | 'build' | 'execute' | 'review' | 'complete';

export interface ChatMessage {
  id: string;
  role: 'sentinel' | 'user';
  content: string;
}

interface ExecutionState {
  selectedScenarioId: string | null;
  runId: string | null;
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  showReveal: boolean;
  revealRationale: string;
  revealNodeCount: number;
  activeNodeId: string | null;
  nodeExecutionStates: Record<string, NodeExecutionState>;
  executionLog: ExecutionLogEntry[];
  liveState: Partial<BoardState>;
  reportMarkdown: string | null;
  docxBuffer: string | null;
  hitlDraftSections: ReportSection[] | null;
  hitlSummary: HITLSummary | null;
  speed: 'slow' | 'normal' | 'fast';
  nodes: Node[];
  edges: Edge[];
  // Phase 3 — compare mode + switch annotation (not in initialState → not reset by resetAll)
  compareMode: boolean;
  switchAnnotation: SwitchAnnotation | null;
  // Visual redesign — app phase + chat
  appPhase: AppPhase;
  chatMessages: ChatMessage[];
  // HITL decision from /review page
  hitlDecision: 'approved' | 'escalated' | null;
  // Error state
  executionError: string | null;
  // Agent inspection
  nodeProgressLogs: Record<string, Array<{ step: string; detail?: string; timestamp: string }>>;
  nodeInputSnapshots: Record<string, unknown>;
  nodeOutputs: Record<string, unknown>;
  selectedNodeId: string | null;
  // Streaming report
  reportSections: ReportSection[];
}

interface ExecutionActions {
  // Selection + run lifecycle
  setScenario: (id: string | null) => void;
  startRun: (runId: string) => void;
  resetAll: () => void;
  setSpeed: (s: 'slow' | 'normal' | 'fast') => void;
  // Phase 3 actions
  toggleCompareMode: () => void;
  setSwitchAnnotation: (a: SwitchAnnotation | null) => void;
  // App phase + chat
  setAppPhase: (phase: AppPhase) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setHitlDecision: (decision: 'approved' | 'escalated') => void;
  setSelectedNodeId: (id: string | null) => void;

  // SSE dispatcher
  handleSSEEvent: (event: SSEEvent) => void;

  // HITL decision (calls /api/hitl)
  submitHITLDecision: (
    runId: string,
    decision: 'approved' | 'revised',
    note?: string,
  ) => Promise<void>;

  // ReactFlow plumbing
  setGraph: (event: GraphConstructedEvent) => void;
  dismissReveal: () => void;
  setNodeState: (nodeId: string, state: NodeExecutionState) => void;
  addLogEntry: (entry: ExecutionLogEntry) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  // Compat aliases
  setRunId: (id: string | null) => void;
  setRunning: (v: boolean) => void;
  setComplete: (v: boolean) => void;
  reset: () => void;
}

const initialState: ExecutionState = {
  selectedScenarioId: null,
  runId: null,
  isRunning: false,
  isPaused: false,
  isComplete: false,
  showReveal: false,
  revealRationale: '',
  revealNodeCount: 0,
  activeNodeId: null,
  nodeExecutionStates: {},
  executionLog: [],
  liveState: {},
  reportMarkdown: null,
  docxBuffer: null,
  hitlDraftSections: null,
  hitlSummary: null,
  speed: 'normal',
  nodes: [],
  edges: [],
  // Phase 3 — in initialState so TypeScript is happy, but preserved by resetAll
  compareMode: false,
  switchAnnotation: null,
  // Visual redesign
  appPhase: 'configure',
  chatMessages: [],
  hitlDecision: null,
  executionError: null,
  nodeProgressLogs: {},
  nodeInputSnapshots: {},
  nodeOutputs: {},
  selectedNodeId: null,
  reportSections: [],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useExecutionStore = create<ExecutionState & ExecutionActions>()(
  persist(
  (set, get) => ({
    ...initialState,

    // ── Lifecycle ──────────────────────────────────────────────────────────

    setScenario: (id) => set({ selectedScenarioId: id }),

    startRun: (runId) =>
      set({
        runId,
        isRunning: true,
        isPaused: false,
        isComplete: false,
        nodeExecutionStates: {},
        executionLog: [],
        liveState: {},
        reportMarkdown: null,
        docxBuffer: null,
        hitlDraftSections: null,
        hitlSummary: null,
        activeNodeId: null,
        nodeProgressLogs: {},
        nodeInputSnapshots: {},
        nodeOutputs: {},
        selectedNodeId: null,
        reportSections: [],
      }),

    resetAll: () => set((s) => ({
      ...initialState,
      // Preserve phase-3 fields and user preferences across resets
      compareMode: s.compareMode,
      switchAnnotation: s.switchAnnotation,
      speed: s.speed,
      appPhase: 'configure',
      chatMessages: [],
      hitlDecision: null,
      executionError: null,
      nodeProgressLogs: {},
      nodeInputSnapshots: {},
      nodeOutputs: {},
      selectedNodeId: null,
      reportSections: [],
    })),

    setSpeed: (s) => set({ speed: s }),

    // ── SSE dispatcher ─────────────────────────────────────────────────────

    handleSSEEvent: (event) => {
      switch (event.type) {
        case 'graph_constructed': {
          const positions = event.visualColumns
            ? computeColumnLayout(event.visualColumns)
            : computeLayout(event.nodes, event.edges);
          const nodes = buildRFNodes(event.nodes, positions);
          const edges = buildRFEdges(event.edges);
          set({
            nodes,
            edges,
            showReveal: true,
            revealRationale: event.rationale,
            revealNodeCount: event.nodeCount,
          });
          break;
        }

        case 'graph_updated': {
          const positions = computeLayout(event.nodes, event.edges);
          const nodes = buildRFNodes(event.nodes, positions);
          const edges = buildRFEdges(event.edges);
          set({ nodes, edges });
          break;
        }

        case 'node_progress': {
          set((prev) => ({
            nodeProgressLogs: {
              ...prev.nodeProgressLogs,
              [event.nodeId]: [
                ...(prev.nodeProgressLogs[event.nodeId] ?? []),
                { step: event.step, detail: event.detail, timestamp: event.timestamp },
              ],
            },
          }));
          break;
        }

        case 'report_section_started': {
          set((prev) => ({
            reportSections: [
              ...prev.reportSections,
              {
                id: event.sectionId,
                title: event.sectionTitle,
                content: '',
                ragStatus: event.ragStatus,
                isStreaming: true,
                isComplete: false,
              },
            ],
          }));
          break;
        }

        case 'report_token': {
          set((prev) => ({
            reportSections: prev.reportSections.map((s) =>
              s.id === event.sectionId ? { ...s, content: s.content + event.token } : s,
            ),
          }));
          break;
        }

        case 'report_section_complete': {
          set((prev) => ({
            reportSections: prev.reportSections.map((s) =>
              s.id === event.sectionId ? { ...s, isStreaming: false, isComplete: true } : s,
            ),
          }));
          break;
        }

        case 'node_started': {
          const logEntry: ExecutionLogEntry = {
            timestamp: event.timestamp,
            nodeId: event.nodeId,
            nodeType: event.nodeType,
            label: event.label,
            summary: 'Started',
          };
          // Log entry appears immediately regardless of delay
          set((prev) => ({
            executionLog: [...prev.executionLog, logEntry],
          }));

          const delay = get().speed === 'slow' ? 600 : get().speed === 'normal' ? 300 : 0;
          const applyStart = () => {
            set((prev) => ({
              activeNodeId: event.nodeId,
              nodeExecutionStates: { ...prev.nodeExecutionStates, [event.nodeId]: 'active' },
              nodes: prev.nodes.map((n) =>
                n.id === event.nodeId
                  ? { ...n, data: { ...n.data, executionState: 'active' } }
                  : n,
              ),
              ...(event.inputSnapshot ? {
                nodeInputSnapshots: {
                  ...prev.nodeInputSnapshots,
                  [event.nodeId]: event.inputSnapshot,
                },
              } : {}),
            }));
          };
          if (delay > 0) {
            setTimeout(applyStart, delay);
          } else {
            applyStart();
          }
          break;
        }

        case 'node_completed': {
          const logEntry: ExecutionLogEntry = {
            timestamp: event.timestamp,
            nodeId: event.nodeId,
            nodeType: event.nodeType,
            label: event.label,
            summary: event.outputSummary,
            durationMs: event.durationMs,
          };
          set((prev) => ({
            activeNodeId: null,
            nodeExecutionStates: { ...prev.nodeExecutionStates, [event.nodeId]: 'completed' },
            executionLog: [...prev.executionLog, logEntry],
            liveState: { ...prev.liveState, ...event.stateDelta },
            reportMarkdown: event.stateDelta.reportMarkdown ?? prev.reportMarkdown,
            docxBuffer: event.stateDelta.docxBuffer ?? prev.docxBuffer,
            nodeOutputs: {
              ...prev.nodeOutputs,
              [event.nodeId]: event.stateDelta,
            },
            nodes: prev.nodes.map((n) =>
              n.id === event.nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      executionState: 'completed',
                      ...(event.nodeId === 'hitl_gate' && event.stateDelta.hitlDecision
                        ? { hitlDecision: event.stateDelta.hitlDecision }
                        : {}),
                    },
                  }
                : n,
            ),
          }));
          break;
        }

        case 'edge_traversed': {
          // No visual change needed — AnimatedEdge handles its own animation
          break;
        }

        case 'hitl_pause': {
          set((prev) => ({
            isPaused: true,
            hitlDraftSections: event.draftSections,
            hitlSummary: event.riskSummary,
            nodeExecutionStates: { ...prev.nodeExecutionStates, hitl_gate: 'paused' },
            nodes: prev.nodes.map((node) =>
              node.id === 'hitl_gate'
                ? {
                    ...node,
                    data: { ...node.data, executionState: 'paused', hitlDecision: 'pending' },
                  }
                : node,
            ),
          }));
          break;
        }

        case 'hitl_resumed': {
          set({ isPaused: false, hitlDraftSections: null, hitlSummary: null });
          break;
        }

        case 'loop_back': {
          const logEntry: ExecutionLogEntry = {
            timestamp: event.timestamp,
            nodeId: event.fromNode,
            nodeType: 'orchestrator',
            label: 'Loop back',
            summary: `Loop ${event.loopCount}: ${event.fromNode} → ${event.toNode}`,
          };
          set((prev) => ({ executionLog: [...prev.executionLog, logEntry] }));
          break;
        }

        case 'execution_complete': {
          set({
            isRunning: false,
            isComplete: true,
            activeNodeId: null,
            reportMarkdown: event.reportMarkdown,
          });
          break;
        }

        case 'error': {
          const logEntry: ExecutionLogEntry = {
            timestamp: event.timestamp,
            nodeId: event.nodeId ?? 'system',
            nodeType: 'deterministic',
            label: 'Error',
            summary: event.message,
          };
          set((prev) => ({
            isRunning: false,
            executionError: event.message ?? 'Execution failed',
            executionLog: [...prev.executionLog, logEntry],
          }));
          break;
        }
      }
    },

    // ── HITL ───────────────────────────────────────────────────────────────

    submitHITLDecision: async (runId, decision, note) => {
      const response = await fetch('/api/hitl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId, decision, note }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit CFO review decision.');
      }

      set({ isPaused: false, hitlDraftSections: null, hitlSummary: null });
    },

    // ── ReactFlow plumbing ─────────────────────────────────────────────────

    setGraph: (event) => {
      get().handleSSEEvent(event);
    },

    dismissReveal: () => set({ showReveal: false }),

    setNodeState: (nodeId, state) =>
      set((prev) => ({
        activeNodeId:
          state === 'active'
            ? nodeId
            : state === 'idle'
              ? null
              : prev.activeNodeId,
        nodeExecutionStates: { ...prev.nodeExecutionStates, [nodeId]: state },
        nodes: prev.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, executionState: state } }
            : n,
        ),
      })),

    addLogEntry: (entry) =>
      set((prev) => ({ executionLog: [...prev.executionLog, entry] })),

    onNodesChange: (changes) =>
      set((prev) => ({ nodes: applyNodeChanges(changes, prev.nodes) })),

    onEdgesChange: (changes) =>
      set((prev) => ({ edges: applyEdgeChanges(changes, prev.edges) })),

    // ── Phase 3 ────────────────────────────────────────────────────────────

    toggleCompareMode: () => set((s) => ({ compareMode: !s.compareMode })),
    setSwitchAnnotation: (a) => set({ switchAnnotation: a }),

    // ── App phase + chat ───────────────────────────────────────────────────

    setAppPhase: (phase) => set({ appPhase: phase }),
    addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),
    setHitlDecision: (decision) => set({ hitlDecision: decision }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),

    // ── Compat aliases ─────────────────────────────────────────────────────

    setRunId: (id) => set({ runId: id }),
    setRunning: (v) => set({ isRunning: v }),
    setComplete: (v) => set({ isComplete: v }),
    reset: () => set((s) => ({ ...initialState, compareMode: s.compareMode, speed: s.speed })),
  }),
  {
    name: 'sentinel-execution',
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) => ({
      runId: state.runId,
      selectedScenarioId: state.selectedScenarioId,
      isRunning: state.isRunning,
      isComplete: state.isComplete,
      isPaused: state.isPaused,
      nodes: state.nodes,
      edges: state.edges,
      nodeExecutionStates: state.nodeExecutionStates,
      executionLog: state.executionLog,
      activeNodeId: state.activeNodeId,
      reportMarkdown: state.reportMarkdown,
      hitlDraftSections: state.hitlDraftSections,
      hitlSummary: state.hitlSummary,
      hitlDecision: state.hitlDecision,
      appPhase: state.appPhase,
      nodeProgressLogs: state.nodeProgressLogs,
      nodeInputSnapshots: state.nodeInputSnapshots,
      nodeOutputs: state.nodeOutputs,
      reportSections: state.reportSections,
    }),
  }
  ),
);
