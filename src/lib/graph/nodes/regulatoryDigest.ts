import type { RunnableConfig } from '@langchain/core/runnables';
import OpenAI from 'openai';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { RegulatoryDigest } from '@/types/state';
import type { SSEEvent } from '@/types/events';
import { REGULATORY_DIGEST_PROMPT } from '@/lib/prompts/regulatoryDigest';

const nodeMeta = NODE_REGISTRY.regulatory_digest;
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

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
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  try {
    const regulatory = state.rawData.regulatory ?? {};

    const response = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: REGULATORY_DIGEST_PROMPT },
        { role: 'user', content: JSON.stringify({ regulatory }) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as RegulatoryDigest;

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

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'Regulatory digest failed — state unchanged.',
      stateDelta: {},
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    return {};
  }
}
