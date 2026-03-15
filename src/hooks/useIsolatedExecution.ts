'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { SSEEvent } from '@/types/events';
import { computeLayout, buildRFNodes, buildRFEdges } from '@/store/executionStore';
import type { ExecutionLogEntry } from '@/types/state';

// ─── Isolated state shape (minimal — compare view only needs graph + reveal) ─

export interface IsolatedState {
  runId: string | null;
  isRunning: boolean;
  isComplete: boolean;
  nodes: Node[];
  edges: Edge[];
  showReveal: boolean;
  revealRationale: string;
  revealNodeCount: number;
  executionLog: ExecutionLogEntry[];
  activeNodeId: string | null;
}

const INITIAL: IsolatedState = {
  runId: null,
  isRunning: false,
  isComplete: false,
  nodes: [],
  edges: [],
  showReveal: false,
  revealRationale: '',
  revealNodeCount: 0,
  executionLog: [],
  activeNodeId: null,
};

// ─── Pure event reducer ───────────────────────────────────────────────────────

function applyEvent(state: IsolatedState, event: SSEEvent): IsolatedState {
  switch (event.type) {
    case 'graph_constructed': {
      const positions = computeLayout(event.nodes, event.edges);
      return {
        ...state,
        nodes: buildRFNodes(event.nodes, positions),
        edges: buildRFEdges(event.edges),
        showReveal: true,
        revealRationale: event.rationale,
        revealNodeCount: event.nodeCount,
      };
    }

    case 'node_started': {
      const entry: ExecutionLogEntry = {
        timestamp: event.timestamp,
        nodeId: event.nodeId,
        nodeType: event.nodeType,
        label: event.label,
        summary: 'Started',
      };
      return {
        ...state,
        activeNodeId: event.nodeId,
        executionLog: [...state.executionLog, entry],
        nodes: state.nodes.map((n) =>
          n.id === event.nodeId
            ? { ...n, data: { ...n.data, executionState: 'active' } }
            : n,
        ),
      };
    }

    case 'node_completed': {
      const entry: ExecutionLogEntry = {
        timestamp: event.timestamp,
        nodeId: event.nodeId,
        nodeType: event.nodeType,
        label: event.label,
        summary: event.outputSummary,
        durationMs: event.durationMs,
      };
      return {
        ...state,
        activeNodeId: null,
        executionLog: [...state.executionLog, entry],
        nodes: state.nodes.map((n) =>
          n.id === event.nodeId
            ? { ...n, data: { ...n.data, executionState: 'completed' } }
            : n,
        ),
      };
    }

    case 'execution_complete': {
      return { ...state, isRunning: false, isComplete: true, activeNodeId: null };
    }

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface AnalyzeResponse {
  run_id: string;
}

export function useIsolatedExecution() {
  const [state, setState] = useState<IsolatedState>(INITIAL);
  // Keep runId in ref to avoid re-creating the SSE effect on every state update
  const runIdRef = useRef<string | null>(null);

  // Wire SSE to state reducer
  useEffect(() => {
    const runId = runIdRef.current;
    if (!runId) return;

    let es: EventSource | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      es = new EventSource(`/api/stream/${runId}`);

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data as string) as SSEEvent;
          setState((s) => applyEvent(s, event));
        } catch {
          // ignore malformed
        }
      };

      es.onerror = () => {
        es?.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      es?.close();
    };
  // We deliberately use state.runId as the trigger (not runIdRef) to re-run on new runs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.runId]);

  const startExecution = useCallback(async (scenarioId: string) => {
    setState(INITIAL);
    runIdRef.current = null;

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });

    if (!res.ok) return;

    const data = await res.json() as AnalyzeResponse;
    runIdRef.current = data.run_id;
    setState((s) => ({ ...s, runId: data.run_id, isRunning: true }));
  }, []);

  const dismissReveal = useCallback(() => {
    setState((s) => ({ ...s, showReveal: false }));
  }, []);

  return { ...state, startExecution, dismissReveal };
}
