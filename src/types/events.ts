import type { BoardState } from '@/lib/graph/state';
import type { NodeType } from '@/types/state';
import type { HITLSummary, ReportSection } from '@/types/state';

// ─── Edge Definition ─────────────────────────────────────────────────────────

export interface EdgeDef {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: 'default' | 'conditional' | 'loop';
}

// ─── SSE Event Types ──────────────────────────────────────────────────────────

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

// ─── Named Event Interfaces ───────────────────────────────────────────────────

export interface GraphConstructedEvent {
  type: 'graph_constructed';
  runId: string;
  nodes: string[];
  edges: EdgeDef[];
  rationale: string;
  nodeCount: number;
}

export interface GraphUpdatedEvent {
  type: 'graph_updated';
  runId: string;
  nodes: string[];
  edges: EdgeDef[];
}

export interface NodeStartedEvent {
  type: 'node_started';
  runId: string;
  nodeId: string;
  nodeType: NodeType;
  label: string;
  timestamp: string;
}

export interface NodeCompletedEvent {
  type: 'node_completed';
  runId: string;
  nodeId: string;
  nodeType: NodeType;
  label: string;
  outputSummary: string;
  durationMs: number;
  stateDelta: Partial<BoardState>;
  timestamp: string;
}

export interface EdgeTraversedEvent {
  type: 'edge_traversed';
  runId: string;
  edgeId: string;
  source: string;
  target: string;
  timestamp: string;
}

export interface HITLPauseEvent {
  type: 'hitl_pause';
  runId: string;
  riskSummary: HITLSummary;
  draftSections: ReportSection[];
  timestamp: string;
}

export interface HITLResumedEvent {
  type: 'hitl_resumed';
  runId: string;
  decision: 'approved' | 'revised';
  note?: string;
  timestamp: string;
}

export interface LoopBackEvent {
  type: 'loop_back';
  runId: string;
  fromNode: string;
  toNode: string;
  loopCount: number;
  timestamp: string;
}

export interface ExecutionCompleteEvent {
  type: 'execution_complete';
  runId: string;
  durationMs: number;
  reportMarkdown: string | null;
  timestamp: string;
}

export interface ErrorEvent {
  type: 'error';
  runId: string;
  nodeId?: string;
  message: string;
  timestamp: string;
}

// ─── Discriminated Union ──────────────────────────────────────────────────────

export type SSEEvent =
  | GraphConstructedEvent
  | GraphUpdatedEvent
  | NodeStartedEvent
  | NodeCompletedEvent
  | EdgeTraversedEvent
  | HITLPauseEvent
  | HITLResumedEvent
  | LoopBackEvent
  | ExecutionCompleteEvent
  | ErrorEvent;
