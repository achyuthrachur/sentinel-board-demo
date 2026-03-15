import type { RunnableConfig } from '@langchain/core/runnables';
import OpenAI from 'openai';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { OperationalRiskDigest } from '@/types/state';
import type { SSEEvent } from '@/types/events';
import { OPERATIONAL_RISK_PROMPT } from '@/lib/prompts/operationalRisk';

const nodeMeta = NODE_REGISTRY.operational_risk;
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
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  try {
    const incidents = state.rawData.incidents ?? [];

    const response = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: OPERATIONAL_RISK_PROMPT },
        { role: 'user', content: JSON.stringify({ incidents }) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as OperationalRiskDigest;

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

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'Operational risk digest failed — state unchanged.',
      stateDelta: {},
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    return {};
  }
}
