import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { OperationalRiskDigest } from '@/types/state';
import type { SSEEvent } from '@/types/events';
import { OPERATIONAL_RISK_PROMPT } from '@/lib/prompts/operationalRisk';
import { getOpenAIClient, getModel } from '@/lib/openaiClient';

const nodeMeta = NODE_REGISTRY.operational_risk;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

export async function operationalRisk(
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
    inputSnapshot: (state.rawData.operational ?? null) as Record<string, unknown> | null ?? undefined,
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  try {
    const incidents = state.rawData.incidents ?? [];
    const incidentCount = Array.isArray(incidents) ? incidents.length : 0;
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Reading input data — ${incidentCount} incident(s) loaded`, timestamp: new Date().toISOString() } as SSEEvent);
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Calling language model (${getModel()}) for risk analysis…`, timestamp: new Date().toISOString() } as SSEEvent);

    const response = await getOpenAIClient().chat.completions.create({
      model: getModel(),
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: OPERATIONAL_RISK_PROMPT },
        { role: 'user', content: JSON.stringify({ incidents }) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: 'Extracting structured output from response…', timestamp: new Date().toISOString() } as SSEEvent);
    const parsed = JSON.parse(raw) as OperationalRiskDigest;
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `RAG classification: ${(parsed.ragStatus ?? 'amber').toUpperCase()}`, timestamp: new Date().toISOString() } as SSEEvent);

    const stateDelta: Partial<BoardState> = { operationalRiskDigest: parsed };

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: `Operational risk digest compiled. RAG: ${parsed.ragStatus}. Incidents: ${parsed.incidents?.length ?? 0}.`,
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
      message: `operationalRisk error: ${String(err)}`,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    const fallback: OperationalRiskDigest = {
      incidents: [],
      topRisks: ['Operational risk analysis unavailable — LLM error'],
      controlGaps: [],
      narrative: 'Operational risk analysis unavailable — LLM error',
      ragStatus: 'amber',
    };
    const stateDelta: Partial<BoardState> = { operationalRiskDigest: fallback };
    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'Operational risk digest failed — static fallback used.',
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);
    return stateDelta;
  }
}
