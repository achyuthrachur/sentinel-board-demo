import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getScenario } from '@/data/scenarios';
import { emit, closeStream } from '@/lib/eventEmitter';
import { buildGraph, setActiveGraph, clearActiveGraph } from '@/lib/graph/graph';
import { runMetaAgent } from '@/lib/graph/metaAgent';
import type { BoardState } from '@/lib/graph/state';
import type { EdgeDef } from '@/types/events';
import type { GraphTopologyPayload } from '@/types/graph';

export const runtime = 'nodejs';

// ─── Edge Builder (column-aware) ──────────────────────────────────────────────

function buildEdges(topology: string[], visualColumns?: string[][]): EdgeDef[] {
  const columns = visualColumns ?? deriveVisualColumns(topology);
  const edges: EdgeDef[] = [];
  const hasSupervisor = topology.includes('supervisor');
  const hasHitl = topology.includes('hitl_gate');
  const hasCompiler = topology.includes('report_compiler');

  for (let col = 0; col < columns.length - 1; col++) {
    const sources = columns[col];
    const targets = columns[col + 1];
    const isParallelToParallel = sources.length > 1 && targets.length > 1;

    for (let si = 0; si < sources.length; si++) {
      const from = sources[si];

      // For parallel-to-parallel, each source connects only to its matching target
      // (by row index, wrapping). This avoids N×M spaghetti edges.
      const targetList = isParallelToParallel
        ? [targets[si % targets.length]]
        : targets;

      for (const to of targetList) {
        // Supervisor → hitl/compiler get conditional edges, skip default
        if (from === 'supervisor' && hasSupervisor) {
          if (to === 'hitl_gate') {
            edges.push({
              id: `e-${from}-${to}-proceed`,
              source: from,
              target: to,
              label: 'PROCEED',
              type: 'conditional',
            });
          } else if (to === 'report_compiler' && hasHitl) {
            // skip — we'll add the skip edge separately below
          } else {
            edges.push({
              id: `e-${from}-${to}`,
              source: from,
              target: to,
              type: 'default',
            });
          }
          continue;
        }

        edges.push({
          id: `e-${from}-${to}`,
          source: from,
          target: to,
          type: 'default',
        });
      }
    }
  }

  // Supervisor skip-HITL edge (bypasses to report_compiler)
  if (hasSupervisor && hasHitl && hasCompiler) {
    edges.push({
      id: 'e-supervisor-skip',
      source: 'supervisor',
      target: 'report_compiler',
      label: 'SKIP_HITL',
      type: 'conditional',
    });
  }

  return edges;
}

// ─── Visual Column Derivation (for custom topologies) ─────────────────────────

const COL_ORDER: Record<string, number> = {
  meta_agent: 0,
  financial_aggregator: 1, capital_monitor: 1, credit_quality: 1,
  trend_analyzer: 2, regulatory_digest: 2, operational_risk: 2,
  supervisor: 3,
  hitl_gate: 4,
  report_compiler: 5,
};

function deriveVisualColumns(topology: string[]): string[][] {
  const colMap = new Map<number, string[]>();
  for (const id of topology) {
    const col = COL_ORDER[id] ?? 3;
    if (!colMap.has(col)) colMap.set(col, []);
    colMap.get(col)!.push(id);
  }
  return [...colMap.entries()].sort((a, b) => a[0] - b[0]).map(([, agents]) => agents);
}

// ─── Async Execution ───────────────────────────────────────────────────────────

async function runGraphAsync(
  runId: string,
  graph: Awaited<ReturnType<typeof buildGraph>>,
  initialState: Partial<BoardState>,
): Promise<void> {
  try {
    const stream = graph.stream(initialState, {
      configurable: { runId },
    });

    // Drain the stream — nodes emit their own SSE events internally
    for await (const _chunk of await stream) {
      // Each chunk is { [nodeId]: Partial<BoardState> }
      // Nodes handle their own SSE emission; we just advance the iterator
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    emit(runId, {
      type: 'error',
      runId,
      message: `Graph execution failed: ${message}`,
      timestamp: new Date().toISOString(),
    });
  } finally {
    clearActiveGraph(runId);
    closeStream(runId);
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let scenarioId: string;
  let customNodes: string[] | undefined;
  try {
    const body = await req.json() as { scenario_id?: unknown; custom_nodes?: unknown };
    if (typeof body.scenario_id !== 'string' || !body.scenario_id) {
      return NextResponse.json({ error: 'scenario_id is required' }, { status: 400 });
    }
    scenarioId = body.scenario_id;
    if (Array.isArray(body.custom_nodes) && body.custom_nodes.every((n) => typeof n === 'string')) {
      customNodes = body.custom_nodes as string[];
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let scenario;
  try {
    scenario = getScenario(scenarioId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 404 });
  }

  const runId = crypto.randomUUID();

  // Use custom_nodes if provided, otherwise run meta-agent to determine topology
  let topology: string[];
  let rationale: string;
  if (customNodes && customNodes.length > 0) {
    topology = customNodes;
    rationale = `Custom agent selection: ${customNodes.join(', ')}`;
  } else {
    const result = await runMetaAgent(scenario);
    topology = result.topology;
    rationale = result.rationale;
  }

  // Compute visual columns: use scenario's if preset, otherwise derive from topology
  const visualColumns = (!customNodes || customNodes.length === 0)
    ? scenario.visualColumns
    : deriveVisualColumns(topology);

  const edges = buildEdges(topology, visualColumns);

  const graphTopology: GraphTopologyPayload = {
    nodes: topology,
    edges,
    executionOrder: topology,
    hitlRequired: scenario.hitlRequired,
    estimatedNodes: topology.length,
  };

  // Build and store the compiled graph
  const graph = buildGraph(topology);
  setActiveGraph(runId, graph);

  // Compose initial state from scenario data
  const initialState: Partial<BoardState> = {
    scenarioId: scenario.id,
    meetingType: scenario.meetingType,
    meetingDate: scenario.meetingDate,
    institutionName: scenario.institutionName,
    rawData: {
      ...(scenario.financials ? { financials: scenario.financials } : {}),
      ...(scenario.capital ? { capital: scenario.capital } : {}),
      ...(scenario.credit ? { credit: scenario.credit } : {}),
      ...(scenario.regulatory ? { regulatory: scenario.regulatory } : {}),
      ...(scenario.incidents ? { incidents: scenario.incidents } : {}),
      hitlRequired: scenario.hitlRequired,
    },
    graphTopology,
    financialMetrics: null,
    capitalMetrics: null,
    creditMetrics: null,
    kpiScorecard: null,
    trendAnalysis: null,
    regulatoryDigest: null,
    operationalRiskDigest: null,
    executiveNarrative: null,
    supervisorDecision: null,
    supervisorRationale: null,
    loopCount: 0,
    hitlDecision: null,
    hitlNote: null,
    reportDraft: null,
    reportMarkdown: null,
    docxBuffer: null,
    activeNode: null,
    executionLog: [],
    errors: [],
  };

  // Emit graph_constructed (buffered if SSE controller not yet registered)
  emit(runId, {
    type: 'graph_constructed',
    runId,
    nodes: topology,
    edges,
    rationale,
    nodeCount: topology.length,
    visualColumns,
  });

  // Fire-and-forget graph execution
  void runGraphAsync(runId, graph, initialState);

  return NextResponse.json({
    run_id: runId,
    graph_topology: graphTopology,
    node_count: topology.length,
    meta_rationale: rationale,
    visual_columns: visualColumns,
    edges,
  });
}
