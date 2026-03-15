export type NodeType =
  | 'deterministic'
  | 'algorithmic'
  | 'hybrid'
  | 'llm'
  | 'orchestrator'
  | 'human';

export type RAGStatus = 'red' | 'amber' | 'green';

// ─── Sub-shapes ─────────────────────────────────────────────────────────────

export interface MetricWithPriorBudget {
  value: number;
  priorPeriod: number;
  budget: number;
  variance: number;
}

export interface MetricWithMinimum {
  value: number;
  minimum: number;
  wellCapitalized?: number;
}

export interface MetricWithPeer {
  value: number;
  priorPeriod: number;
  peerMedian: number;
}

export interface MRAItem {
  id: string;
  description: string;
  severity: 'critical' | 'serious' | 'moderate';
  dueDate: string;
  status: 'open' | 'overdue' | 'in_progress';
}

export interface ExamItem {
  examiner: string;
  scheduledDate: string;
  scope: string;
  status: 'scheduled' | 'in_progress' | 'completed';
}

export interface ConcentrationRisk {
  segment: string;
  percentage: number;
  limit: number;
  hhi?: number;
}

export interface WatchlistMovement {
  loanId: string;
  borrower: string;
  direction: 'upgrade' | 'downgrade';
  fromRating: string;
  toRating: string;
  balance: number;
}

// ─── Primary Metrics Interfaces ──────────────────────────────────────────────

export interface FinancialMetrics {
  nim: MetricWithPriorBudget;
  roa: MetricWithPriorBudget;
  roe: MetricWithPriorBudget;
  nonInterestIncome: MetricWithPriorBudget;
  efficiencyRatio: MetricWithPriorBudget;
  ragStatus: RAGStatus;
  flags: string[];
}

export interface CapitalMetrics {
  cet1: MetricWithMinimum;
  tierOne: MetricWithMinimum;
  totalCapital: MetricWithMinimum;
  lcr: MetricWithMinimum;
  nsfr: MetricWithMinimum;
  ragStatus: RAGStatus;
  flags: string[];
}

export interface CreditMetrics {
  nplRatio: MetricWithPeer;
  provisionCoverageRatio: MetricWithPeer;
  ncoRatio: MetricWithPeer;
  concentrations: ConcentrationRisk[];
  watchlistMovements: WatchlistMovement[];
  ragStatus: RAGStatus;
  flags: string[];
}

export interface KPIScorecard {
  overallScore: number;
  categoryScores: Record<string, number>;
  ragStatus: RAGStatus;
  highlights: string[];
  concerns: string[];
}

export interface TrendAnalysis {
  nimTrend: number[];
  roaTrend: number[];
  roeTrend: number[];
  nplTrend: number[];
  efficiencyTrend: number[];
  cet1Trend: number[];
  quarters: string[];
  narrative: string;
  ragStatus: RAGStatus;
}

export interface RegulatoryDigest {
  openMRAs: MRAItem[];
  overdueItems: MRAItem[];
  upcomingExams: ExamItem[];
  summary: string;
  escalationRequired: boolean;
}

export interface OperationalRiskDigest {
  incidents: {
    summary: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'investigating' | 'resolved';
  }[];
  topRisks: string[];
  controlGaps: string[];
  narrative: string;
  ragStatus: RAGStatus;
}

// ─── Report Types ────────────────────────────────────────────────────────────

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  ragStatus?: RAGStatus;
  metrics?: Record<string, unknown>;
}

export interface HITLSummary {
  financialRag: RAGStatus;
  capitalRag: RAGStatus;
  creditRag: RAGStatus;
  openMRAs: number;
  overdueRemediations: number;
  keyFlags: string[];
}

export interface ReportMetadata {
  scenarioId: string;
  institutionName: string;
  meetingDate: string;
  meetingType: string;
  generatedAt: string;
  version: number;
}

export interface ReportDraft {
  sections: ReportSection[];
  metadata: ReportMetadata;
}

// ─── Execution Log ───────────────────────────────────────────────────────────

export interface ExecutionLogEntry {
  timestamp: string;
  nodeId: string;
  nodeType: NodeType;
  label: string;
  summary: string;
  durationMs?: number;
}
