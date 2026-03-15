import type { NodeType } from '@/types/state';
import type { EdgeDef } from '@/types/events';

// Re-export EdgeDef for convenience
export type { EdgeDef };

// ─── Node Execution State ─────────────────────────────────────────────────────

export type NodeExecutionState =
  | 'idle'
  | 'active'
  | 'completed'
  | 'paused'
  | 'error';

// ─── Node Metadata ────────────────────────────────────────────────────────────

export interface NodeMeta {
  id: string;
  type: NodeType;
  label: string;
  badgeLabel: string;
  color: string;
  description: string;
  formulaHint?: string;
}

// ─── ReactFlow Custom Node Variants ──────────────────────────────────────────

export interface DeterministicNodeData extends NodeMeta {
  executionState: NodeExecutionState;
  durationMs?: number;
}

export interface AlgorithmicNodeData extends NodeMeta {
  executionState: NodeExecutionState;
  durationMs?: number;
  scoreOutput?: number;
}

export interface HybridNodeData extends NodeMeta {
  executionState: NodeExecutionState;
  durationMs?: number;
}

export interface LLMNodeData extends NodeMeta {
  executionState: NodeExecutionState;
  durationMs?: number;
  tokenCount?: number;
}

export interface OrchestratorNodeData extends NodeMeta {
  executionState: NodeExecutionState;
  loopCount?: number;
  decision?: string;
}

export interface HITLNodeData extends NodeMeta {
  executionState: NodeExecutionState;
  hitlDecision?: 'pending' | 'approved' | 'revised' | null;
}

// ─── Graph Topology Payload ───────────────────────────────────────────────────

export interface GraphTopologyPayload {
  nodes: string[];
  edges: EdgeDef[];
  executionOrder: string[];
  hitlRequired: boolean;
  estimatedNodes: number;
}
