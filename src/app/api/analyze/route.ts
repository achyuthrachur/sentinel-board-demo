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

// ─── Edge Builder ──────────────────────────────────────────────────────────────

function buildEdges(topology: string[]): EdgeDef[] {
  const edges: EdgeDef[] = [];
  const supervisorIdx = topology.indexOf('supervisor');

  if (supervisorIdx === -1) {
    // Linear chain — Risk Flash style
    for (let i = 0; i < topology.length - 1; i++) {
      edges.push({
        id: `e-${topology[i]}-${topology[i + 1]}`,
        source: topology[i],
        target: topology[i + 1],
        type: 'default',
      });
    }
  } else {
    // Sequential edges up to supervisor
    for (let i = 0; i < supervisorIdx; i++) {
      edges.push({
        id: `e-${topology[i]}-${topology[i + 1]}`,
        source: topology[i],
        target: topology[i + 1],
        type: 'default',
      });
    }

    // Conditional edges out of supervisor
    const hasHitl = topology.includes('hitl_gate');
    edges.push({
      id: 'e-supervisor-proceed',
      source: 'supervisor',
      target: hasHitl ? 'hitl_gate' : 'report_compiler',
      label: 'PROCEED',
      type: 'conditional',
    });
    edges.push({
      id: 'e-supervisor-skip',
      source: 'supervisor',
      target: 'report_compiler',
      label: 'SKIP_HITL',
      type: 'conditional',
    });

    if (hasHitl) {
      edges.push({
        id: 'e-hitl_gate-report_compiler',
        source: 'hitl_gate',
        target: 'report_compiler',
        type: 'default',
      });
    }
  }

  return edges;
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
  try {
    const body = await req.json() as { scenario_id?: unknown };
    if (typeof body.scenario_id !== 'string' || !body.scenario_id) {
      return NextResponse.json({ error: 'scenario_id is required' }, { status: 400 });
    }
    scenarioId = body.scenario_id;
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

  // Meta-agent call to determine topology
  const { topology, rationale } = await runMetaAgent(scenario);

  const edges = buildEdges(topology);

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
  });

  // Fire-and-forget graph execution
  void runGraphAsync(runId, graph, initialState);

  return NextResponse.json({
    run_id: runId,
    graph_topology: graphTopology,
    node_count: topology.length,
    meta_rationale: rationale,
  });
}
