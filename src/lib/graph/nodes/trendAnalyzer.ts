import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { TrendAnalysis, RAGStatus } from '@/types/state';
import type { SSEEvent } from '@/types/events';
import { sleep } from '@/lib/graph/utils';
import { POPULATION_BASELINE, QUARTERS } from '@/data/populationBaseline';
import { TREND_NARRATIVE_PROMPT } from '@/lib/prompts/trendAnalyzerNarrative';
import { getOpenAIClient, getModel } from '@/lib/openaiClient';

const nodeMeta = NODE_REGISTRY.trend_analyzer;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

function linearSlope(values: readonly number[]): number {
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  const num = values.reduce((s, v, i) => s + (i - meanX) * (v - meanY), 0);
  const den = values.reduce((s, _, i) => s + (i - meanX) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

function stdDev(values: readonly number[]): number {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
}

export async function trendAnalyzer(
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
    inputSnapshot: { financialMetrics: state.financialMetrics, capitalMetrics: state.capitalMetrics, creditMetrics: state.creditMetrics } as Record<string, unknown>,
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: 'Loading 5-quarter rolling data from population baseline…', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  // ── Step 1: deterministic regression on POPULATION_BASELINE ──────────────────

  const nimSlope = linearSlope(POPULATION_BASELINE.nim);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Computing NIM linear regression: slope ${nimSlope.toFixed(3)}%/qtr…`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const nplSlope = linearSlope(POPULATION_BASELINE.nplRatio);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Computing NPL ratio regression: slope ${nplSlope > 0 ? '+' : ''}${nplSlope.toFixed(3)}%/qtr…`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  const efficiencySlope = linearSlope(POPULATION_BASELINE.efficiencyRatio);
  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Computing efficiency ratio regression: slope ${efficiencySlope > 0 ? '+' : ''}${efficiencySlope.toFixed(3)}%/qtr…`, timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(250);

  // Flag if |slope| > stdDev / n for the series (adverse direction)
  const n = POPULATION_BASELINE.nim.length;
  const nimFlagged = nimSlope < 0 && Math.abs(nimSlope) > stdDev(POPULATION_BASELINE.nim) / n;
  const nplFlagged = nplSlope > 0 && nplSlope > stdDev(POPULATION_BASELINE.nplRatio) / n;
  const effFlagged =
    efficiencySlope > 0 && efficiencySlope > stdDev(POPULATION_BASELINE.efficiencyRatio) / n;

  const flaggedMetrics: string[] = [];
  if (nimFlagged) flaggedMetrics.push(`NIM slope ${nimSlope.toFixed(3)}%/qtr (declining)`);
  if (nplFlagged) flaggedMetrics.push(`NPL slope +${nplSlope.toFixed(3)}%/qtr (rising)`);
  if (effFlagged)
    flaggedMetrics.push(`Efficiency ratio slope +${efficiencySlope.toFixed(3)}%/qtr (rising)`);

  const trendPayload = {
    nimTrend: [...POPULATION_BASELINE.nim],
    roaTrend: [...POPULATION_BASELINE.roa],
    roeTrend: [...POPULATION_BASELINE.roe],
    nplTrend: [...POPULATION_BASELINE.nplRatio],
    efficiencyTrend: [...POPULATION_BASELINE.efficiencyRatio],
    cet1Trend: [...POPULATION_BASELINE.cet1Ratio],
    quarters: [...QUARTERS],
  };

  emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Regression complete — ${flaggedMetrics.length} metric(s) flagged`, detail: flaggedMetrics.length > 0 ? flaggedMetrics.join('; ') : 'No adverse trends detected', timestamp: new Date().toISOString() } as SSEEvent);
  await sleep(300);

  // ── Step 2: LLM narrative only when flags found ────────────────────────────

  let trendAnalysis: TrendAnalysis;

  if (flaggedMetrics.length > 0) {
    try {
      emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Calling language model (${getModel()}) for narrative interpretation…`, timestamp: new Date().toISOString() } as SSEEvent);
      const response = await getOpenAIClient().chat.completions.create({
        model: getModel(),
        response_format: { type: 'json_object' },
        temperature: 0.1,
        messages: [
          { role: 'system', content: TREND_NARRATIVE_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              ...trendPayload,
              flaggedMetrics,
              slopes: { nim: nimSlope, npl: nplSlope, efficiencyRatio: efficiencySlope },
            }),
          },
        ],
      });

      const raw = response.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as TrendAnalysis;
      trendAnalysis = { ...trendPayload, ...parsed };
    } catch (err) {
      emit(runId, {
        type: 'error',
        runId,
        nodeId: nodeMeta.id,
        message: `trendAnalyzer LLM error: ${String(err)}`,
        timestamp: new Date().toISOString(),
      } as SSEEvent);
      // Fallback: deterministic narrative
      const ragStatus: RAGStatus = flaggedMetrics.length >= 2 ? 'red' : 'amber';
      trendAnalysis = {
        ...trendPayload,
        narrative: `Adverse trends flagged: ${flaggedMetrics.join('; ')}. Board attention warranted.`,
        ragStatus,
      };
    }
  } else {
    trendAnalysis = {
      ...trendPayload,
      narrative:
        'Key performance metrics show stable to improving trends across the review period, with no statistically significant adverse movements detected.',
      ragStatus: 'green',
    };
  }

  const stateDelta: Partial<BoardState> = { trendAnalysis };

  emit(runId, {
    type: 'node_completed',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    outputSummary: `Trend analysis complete. RAG: ${trendAnalysis.ragStatus}. Flags: ${flaggedMetrics.length}.`,
    stateDelta,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  } as SSEEvent);

  return stateDelta;
}
