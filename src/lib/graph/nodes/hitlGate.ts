import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { emit, registerHITLResolver, type HITLDecision } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import type { SSEEvent } from '@/types/events';
import type { HITLSummary } from '@/types/state';

const nodeMeta = NODE_REGISTRY.hitl_gate;

function buildHitlSummary(state: BoardState): HITLSummary {
  const keyFlags = [
    ...(state.financialMetrics?.flags ?? []),
    ...(state.capitalMetrics?.flags ?? []),
    ...(state.creditMetrics?.flags ?? []),
    ...(state.regulatoryDigest?.overdueItems.length
      ? [`${state.regulatoryDigest.overdueItems.length} overdue remediation item(s) require attention`]
      : []),
    ...(state.operationalRiskDigest?.topRisks ?? []),
  ];

  const uniqueFlags = [...new Set(keyFlags.map((flag) => flag.trim()).filter(Boolean))];

  return {
    financialRag: state.financialMetrics?.ragStatus ?? 'amber',
    capitalRag: state.capitalMetrics?.ragStatus ?? 'amber',
    creditRag: state.creditMetrics?.ragStatus ?? 'amber',
    openMRAs: state.regulatoryDigest?.openMRAs.length ?? 0,
    overdueRemediations: state.regulatoryDigest?.overdueItems.length ?? 0,
    keyFlags:
      uniqueFlags.length > 0
        ? uniqueFlags.slice(0, 6)
        : ['Board package assembled with no elevated exceptions flagged by the workflow.'],
  };
}

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

export async function hitlGate(
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

  // Emit pause event so the client can render the HITL review UI
  emit(runId, {
    type: 'hitl_pause',
    runId,
    riskSummary: buildHitlSummary(state),
    draftSections: state.reportDraft?.sections ?? [],
    timestamp: new Date().toISOString(),
  } as SSEEvent);

  // Register resolver and await human decision (Promise resolves when /api/hitl is called)
  const decision = await new Promise<HITLDecision>((resolve) => {
    registerHITLResolver(runId, resolve);
  });

  emit(runId, {
    type: 'hitl_resumed',
    runId,
    decision: decision.decision,
    note: decision.note,
    timestamp: new Date().toISOString(),
  } as SSEEvent);

  const stateDelta: Partial<BoardState> = {
    hitlDecision: decision.decision,
    hitlNote: decision.note ?? null,
  };

  emit(runId, {
    type: 'node_completed',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    outputSummary: `HITL decision: ${decision.decision}${decision.note ? ` — "${decision.note}"` : ''}.`,
    stateDelta,
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  } as SSEEvent);

  return stateDelta;
}
