import { StateGraph, START, END } from '@langchain/langgraph';
import type { CompiledStateGraph } from '@langchain/langgraph';
import { BoardStateAnnotation } from './state';
import type { BoardState } from './state';
import { getNodeFunction } from './nodes';

// ─── Types ────────────────────────────────────────────────────────────────────

// Loosely typed compiled graph to support dynamic node assembly.
// LangGraph's N type parameter is accumulated via chained .addNode() calls;
// imperative/looped addNode requires this cast for TypeScript compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CompiledSentinelGraph = CompiledStateGraph<BoardState, Partial<BoardState>, any>;

// ─── Active Graph Store ───────────────────────────────────────────────────────
// Holds one compiled graph per runId so the HITL resume path can call
// updateState on the correct graph instance.

const activeGraphs = new Map<string, CompiledSentinelGraph>();

export function setActiveGraph(runId: string, graph: CompiledSentinelGraph): void {
  activeGraphs.set(runId, graph);
}

export function getActiveGraph(runId: string): CompiledSentinelGraph | undefined {
  return activeGraphs.get(runId);
}

export function clearActiveGraph(runId: string): void {
  activeGraphs.delete(runId);
}

// ─── Supervisor Router ────────────────────────────────────────────────────────
// Returns the name of the next node. Called by LangGraph's conditional edge
// machinery after the supervisor node completes.
//
// Decision encoding in state.supervisorDecision:
//   'PROCEED_TO_HITL'       → hitl_gate (if in topology) else report_compiler
//   'SKIP_HITL_COMPILE'     → report_compiler
//   'ESCALATE'              → report_compiler (escalation signalled via state)
//   'LOOP_BACK:<nodeId>'    → <nodeId>, capped at 2 loops

function createSupervisorRouter(topology: string[]) {
  const hitlTarget = topology.includes('hitl_gate') ? 'hitl_gate' : 'report_compiler';

  return function supervisorRouter(state: BoardState): string {
    const decision = state.supervisorDecision ?? '';

    if (decision === 'SKIP_HITL_COMPILE' || decision === 'ESCALATE') {
      return 'report_compiler';
    }

    if (decision.startsWith('LOOP_BACK:')) {
      const target = decision.split(':')[1];
      const isValidTarget =
        typeof target === 'string' &&
        topology.includes(target) &&
        !['supervisor', 'hitl_gate', 'report_compiler', 'meta_agent'].includes(target);

      if (isValidTarget && state.loopCount < 2) {
        return target;
      }
      // Max loops exceeded or invalid target — proceed to normal path
      return hitlTarget;
    }

    // PROCEED_TO_HITL (default)
    return hitlTarget;
  };
}

// ─── Build Graph ──────────────────────────────────────────────────────────────

/**
 * Dynamically builds and compiles a LangGraph StateGraph for the given topology.
 *
 * - Only nodes present in both topology AND getNodeFunction() are added.
 * - Sequential edges are wired from topology[0] through to supervisor.
 * - Conditional edges from supervisor handle all four routing decisions.
 * - If supervisor is absent (e.g. Risk Flash), edges are wired as a linear chain.
 * - Entry: topology[0]  |  Finish: 'report_compiler'
 */
export function buildGraph(topology: string[]): CompiledSentinelGraph {
  if (topology.length === 0) {
    throw new Error('buildGraph: topology must contain at least one node');
  }

  // Cast to `any` to bypass LangGraph's strict N-accumulation type system.
  // At runtime, addNode/addEdge validate node names correctly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workflow = new StateGraph(BoardStateAnnotation) as any;

  // ── Add nodes ──────────────────────────────────────────────────────────────
  for (const nodeId of topology) {
    const fn = getNodeFunction(nodeId);
    if (fn) {
      workflow.addNode(nodeId, fn);
    }
  }

  const supervisorIdx = topology.indexOf('supervisor');

  if (supervisorIdx === -1) {
    // ── Linear chain (no supervisor) ─────────────────────────────────────────
    workflow.addEdge(START, topology[0]);

    for (let i = 0; i < topology.length - 1; i++) {
      workflow.addEdge(topology[i], topology[i + 1]);
    }

    workflow.addEdge(topology[topology.length - 1], END);
  } else {
    // ── Graph with supervisor ─────────────────────────────────────────────────
    workflow.addEdge(START, topology[0]);

    // Sequential edges leading up to (but not including) supervisor
    for (let i = 0; i < supervisorIdx; i++) {
      workflow.addEdge(topology[i], topology[i + 1]);
    }

    // Conditional edges from supervisor
    // routeMap keys = values returned by supervisorRouter
    const routeMap: Record<string, string> = {
      // PROCEED_TO_HITL
      hitl_gate: topology.includes('hitl_gate') ? 'hitl_gate' : 'report_compiler',
      // SKIP_HITL_COMPILE and ESCALATE
      report_compiler: 'report_compiler',
    };

    // LOOP_BACK targets: any analysis node between meta_agent and supervisor
    for (const nodeId of topology) {
      if (
        !['supervisor', 'hitl_gate', 'report_compiler', 'meta_agent'].includes(nodeId) &&
        !(nodeId in routeMap)
      ) {
        routeMap[nodeId] = nodeId;
      }
    }

    workflow.addConditionalEdges('supervisor', createSupervisorRouter(topology), routeMap);

    // Post-supervisor edges
    if (topology.includes('hitl_gate')) {
      workflow.addEdge('hitl_gate', 'report_compiler');
    }

    workflow.addEdge('report_compiler', END);
  }

  return workflow.compile() as CompiledSentinelGraph;
}
