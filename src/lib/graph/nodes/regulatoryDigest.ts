import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { RegulatoryDigest } from '@/types/state';
import type { SSEEvent } from '@/types/events';
import { REGULATORY_DIGEST_PROMPT } from '@/lib/prompts/regulatoryDigest';
import { getOpenAIClient, getModel } from '@/lib/openaiClient';

const nodeMeta = NODE_REGISTRY.regulatory_digest;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

export async function regulatoryDigest(
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
    inputSnapshot: (state.rawData.regulatory ?? null) as Record<string, unknown> | null ?? undefined,
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  try {
    const regulatory = state.rawData.regulatory ?? {};
    const mraCount = (regulatory as { mras?: unknown[] }).mras?.length ?? 0;
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Reading input data — ${mraCount} MRA(s) and exam schedule loaded`, timestamp: new Date().toISOString() } as SSEEvent);
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Calling language model (${getModel()}) for regulatory synthesis…`, timestamp: new Date().toISOString() } as SSEEvent);

    const response = await getOpenAIClient().chat.completions.create({
      model: getModel(),
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: REGULATORY_DIGEST_PROMPT },
        { role: 'user', content: JSON.stringify({ regulatory }) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: 'Extracting structured output from response…', timestamp: new Date().toISOString() } as SSEEvent);
    const parsed = JSON.parse(raw) as RegulatoryDigest;
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `${parsed.openMRAs?.length ?? 0} open MRA(s) — escalation required: ${parsed.escalationRequired}`, timestamp: new Date().toISOString() } as SSEEvent);

    const stateDelta: Partial<BoardState> = { regulatoryDigest: parsed };

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: `Regulatory digest compiled. Open MRAs: ${parsed.openMRAs?.length ?? 0}. Escalation: ${parsed.escalationRequired}.`,
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
      message: `regulatoryDigest error: ${String(err)}`,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    const fallback: RegulatoryDigest = {
      openMRAs: [],
      overdueItems: [],
      upcomingExams: [],
      escalationRequired: false,
      summary: 'Regulatory analysis unavailable — LLM error',
    };
    const stateDelta: Partial<BoardState> = { regulatoryDigest: fallback };
    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'Regulatory digest failed — static fallback used.',
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);
    return stateDelta;
  }
}
