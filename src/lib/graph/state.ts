import { Annotation } from '@langchain/langgraph';
import type {
  FinancialMetrics,
  CapitalMetrics,
  CreditMetrics,
  KPIScorecard,
  TrendAnalysis,
  RegulatoryDigest,
  OperationalRiskDigest,
  ReportDraft,
  ExecutionLogEntry,
} from '@/types/state';
import type { GraphTopologyPayload } from '@/types/graph';

export const BoardStateAnnotation = Annotation.Root({
  // Input fields
  scenarioId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  meetingType: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  meetingDate: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  institutionName: Annotation<string>({
    reducer: (_, next) => next,
    default: () => '',
  }),
  rawData: Annotation<Record<string, unknown>>({
    reducer: (_, next) => next,
    default: () => ({}),
  }),

  // Deterministic outputs
  financialMetrics: Annotation<FinancialMetrics | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  capitalMetrics: Annotation<CapitalMetrics | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  creditMetrics: Annotation<CreditMetrics | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  kpiScorecard: Annotation<KPIScorecard | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Hybrid outputs
  trendAnalysis: Annotation<TrendAnalysis | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // LLM outputs
  regulatoryDigest: Annotation<RegulatoryDigest | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  operationalRiskDigest: Annotation<OperationalRiskDigest | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  executiveNarrative: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Orchestration
  graphTopology: Annotation<GraphTopologyPayload | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  supervisorDecision: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  loopCount: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
  supervisorRationale: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // HITL
  hitlDecision: Annotation<'pending' | 'approved' | 'revised' | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  hitlNote: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Output
  reportDraft: Annotation<ReportDraft | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  reportMarkdown: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  docxBuffer: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Execution metadata
  activeNode: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  executionLog: Annotation<ExecutionLogEntry[]>({
    reducer: (existing, next) => [...existing, ...next],
    default: () => [],
  }),
  errors: Annotation<string[]>({
    reducer: (existing, next) => [...existing, ...next],
    default: () => [],
  }),
});

export type BoardState = typeof BoardStateAnnotation.State;
