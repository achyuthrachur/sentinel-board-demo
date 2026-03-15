import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type {
  CreditMetrics,
  ConcentrationRisk,
  WatchlistMovement,
  MetricWithPeer,
  RAGStatus,
} from '@/types/state';
import type { SSEEvent } from '@/types/events';

const nodeMeta = NODE_REGISTRY.credit_quality;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

interface RawPeerMetric {
  actual: number;
  priorPeriod: number;
  peerMedian: number;
}

interface RawCredit {
  nplRatio: RawPeerMetric;
  provisionCoverageRatio: RawPeerMetric;
  ncoRatio: RawPeerMetric;
  concentrations: ConcentrationRisk[];
  watchlistMovements: WatchlistMovement[];
}

// Each component scores -1, 0, or +1.
// Final score = (w1*s1 + w2*s2 + w3*s3 + w4*s4) * 5  → range –5 to +5
// RAG: ≤ –2 red | –1 to 0 amber | ≥ 1 green

const WEIGHTS = { npl: 0.35, pcr: 0.25, nco: 0.20, conc: 0.20 };

function scoreNPL(actual: number, peer: number): number {
  if (actual < peer) return 1;
  if (actual < peer * 1.2) return 0;
  return -1;
}

function scorePCR(actual: number, peer: number): number {
  if (actual > peer) return 1;
  if (actual > peer * 0.8) return 0;
  return -1;
}

function scoreNCO(actual: number, peer: number): number {
  if (actual < peer) return 1;
  if (actual < peer * 1.2) return 0;
  return -1;
}

function scoreConcentration(concentrations: ConcentrationRisk[]): number {
  const breaches = concentrations.filter((c) => c.percentage > c.limit);
  if (breaches.length === 0) return 1;
  if (breaches.length === 1) return 0;
  return -1;
}

function buildPeerMetric(raw: RawPeerMetric): MetricWithPeer {
  return { value: raw.actual, priorPeriod: raw.priorPeriod, peerMedian: raw.peerMedian };
}

export async function creditQuality(
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

  const rawCredit = state.rawData.credit as RawCredit | undefined;

  if (!rawCredit) {
    const stateDelta: Partial<BoardState> = {};
    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'No credit data in scenario.',
      stateDelta,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    } as SSEEvent);
    return stateDelta;
  }

  const { nplRatio, provisionCoverageRatio, ncoRatio, concentrations, watchlistMovements } =
    rawCredit;

  const sNpl = scoreNPL(nplRatio.actual, nplRatio.peerMedian);
  const sPcr = scorePCR(provisionCoverageRatio.actual, provisionCoverageRatio.peerMedian);
  const sNco = scoreNCO(ncoRatio.actual, ncoRatio.peerMedian);
  const sConc = scoreConcentration(concentrations);

  const creditScore =
    (WEIGHTS.npl * sNpl + WEIGHTS.pcr * sPcr + WEIGHTS.nco * sNco + WEIGHTS.conc * sConc) * 5;

  const ragStatus: RAGStatus = creditScore <= -2 ? 'red' : creditScore < 1 ? 'amber' : 'green';

  const flags: string[] = [];
  if (sNpl < 0)
    flags.push(
      `NPL ratio ${nplRatio.actual.toFixed(2)}% materially above peer median ${nplRatio.peerMedian.toFixed(2)}%`,
    );
  if (sPcr < 0)
    flags.push(
      `Provision coverage ${provisionCoverageRatio.actual.toFixed(1)}% below peer median ${provisionCoverageRatio.peerMedian.toFixed(1)}%`,
    );
  if (sNco < 0)
    flags.push(
      `NCO ratio ${ncoRatio.actual.toFixed(2)}% materially above peer median ${ncoRatio.peerMedian.toFixed(2)}%`,
    );
  const breaches = concentrations.filter((c) => c.percentage > c.limit);
  if (breaches.length > 0)
    flags.push(
      `${breaches.length} concentration limit breach(es): ${breaches.map((b) => b.segment).join(', ')}`,
    );

  const creditMetrics: CreditMetrics = {
    nplRatio: buildPeerMetric(nplRatio),
    provisionCoverageRatio: buildPeerMetric(provisionCoverageRatio),
    ncoRatio: buildPeerMetric(ncoRatio),
    concentrations,
    watchlistMovements,
    ragStatus,
    flags,
  };

  const stateDelta: Partial<BoardState> = { creditMetrics };

  emit(runId, {
    type: 'node_completed',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    outputSummary: `Credit scored ${creditScore.toFixed(2)}. RAG: ${ragStatus}. Flags: ${flags.length}.`,
    stateDelta,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  } as SSEEvent);

  return stateDelta;
}
