import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { SSEEvent } from '@/types/events';
import { SUPERVISOR_PROMPT } from '@/lib/prompts/supervisor';
import { getOpenAIClient, getModel } from '@/lib/openaiClient';

const nodeMeta = NODE_REGISTRY.supervisor;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

interface SupervisorResponse {
  supervisorDecision: string;
  supervisorRationale: string;
}

export async function supervisor(
  state: BoardState,
  config: RunnableConfig,
): Promise<Partial<BoardState>> {
  const runId = getRunId(state, config);
  const startedAt = Date.now();

  emit(runId, {
    type: 'node_started',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    inputSnapshot: { financialMetrics: state.financialMetrics, regulatoryDigest: state.regulatoryDigest, operationalRiskDigest: state.operationalRiskDigest } as Record<string, unknown>,
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  try {
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: 'Reviewing all agent outputs and flag counts…', timestamp: new Date().toISOString() } as SSEEvent);
    const topology = state.graphTopology?.nodes ?? [];
    const context = {
      meetingType: state.meetingType,
      topology,
      loopCount: state.loopCount,
      hitlInTopology: topology.includes('hitl_gate'),
      financialMetrics: state.financialMetrics,
      capitalMetrics: state.capitalMetrics,
      creditMetrics: state.creditMetrics,
      trendAnalysis: state.trendAnalysis,
      regulatoryDigest: state.regulatoryDigest,
      operationalRiskDigest: state.operationalRiskDigest,
    };

    const response = await getOpenAIClient().chat.completions.create({
      model: getModel(),
      response_format: { type: 'json_object' },
      temperature: 0.0,
      messages: [
        { role: 'system', content: SUPERVISOR_PROMPT },
        { role: 'user', content: JSON.stringify(context) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as SupervisorResponse;

    const hitlInTopology = (state.graphTopology?.nodes ?? []).includes('hitl_gate');
    const decision = parsed.supervisorDecision ?? (hitlInTopology ? 'PROCEED_TO_HITL' : 'SKIP_HITL_COMPILE');
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Routing decision: ${decision}`, detail: parsed.supervisorRationale?.slice(0, 100), timestamp: new Date().toISOString() } as SSEEvent);
    const isLoopBack = decision.startsWith('LOOP_BACK:');

    // Determine target for EDGE_TRAVERSED event
    let edgeTarget = 'report_compiler';
    if (decision === 'PROCEED_TO_HITL') edgeTarget = 'hitl_gate';
    else if (isLoopBack) edgeTarget = decision.split(':')[1] ?? 'report_compiler';

    emit(runId, {
      type: 'edge_traversed',
      runId,
      edgeId: `supervisor->${edgeTarget}`,
      source: 'supervisor',
      target: edgeTarget,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    const stateDelta: Partial<BoardState> = {
      supervisorDecision: decision,
      supervisorRationale: parsed.supervisorRationale ?? '',
      loopCount: isLoopBack ? state.loopCount + 1 : state.loopCount,
    };

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: `Supervisor decision: ${decision}. ${parsed.supervisorRationale ?? ''}`,
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    return stateDelta;
  } catch (err) {
    emit(runId, {
      type: 'error',
      runId,
      nodeId: nodeMeta.id,
      message: `supervisor error: ${String(err)}`,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    // When supervisor fails: if HITL is in the topology, default to PROCEED_TO_HITL
    // (conservative — human should review when AI can't). Otherwise SKIP_HITL_COMPILE.
    const hitlInTopology = (state.graphTopology?.nodes ?? []).includes('hitl_gate');
    const fallbackDecision = hitlInTopology ? 'PROCEED_TO_HITL' : 'SKIP_HITL_COMPILE';
    const stateDelta: Partial<BoardState> = { supervisorDecision: fallbackDecision };

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: `Supervisor failed — defaulting to ${fallbackDecision}.`,
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    return stateDelta;
  }
}
