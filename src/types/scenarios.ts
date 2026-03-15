import type {
  ConcentrationRisk,
  ExamItem,
  MRAItem,
  WatchlistMovement,
} from '@/types/state';

export interface ScenarioMetricWithBudget {
  actual: number;
  budget: number;
  priorPeriod: number;
  variance: number;
}

export interface ScenarioMetricWithMinimum {
  actual: number;
  minimum: number;
  wellCapitalized?: number;
}

export interface ScenarioMetricWithPeer {
  actual: number;
  priorPeriod: number;
  peerMedian: number;
}

export interface AuditCoverageItem {
  area: string;
  findings: number | null;
  status: 'completed' | 'deferred';
}

export interface ScenarioIncident {
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  category?: string;
  affectedAccounts?: number;
}

export interface ScenarioData {
  id: string;
  label: string;
  meetingType: string;
  meetingDate: string;
  institutionName: string;
  expectedNodes: string[];
  hitlRequired: boolean;
  financials?: {
    nim: ScenarioMetricWithBudget;
    roa: ScenarioMetricWithBudget;
    roe: ScenarioMetricWithBudget;
    nonInterestIncome: ScenarioMetricWithBudget;
    efficiencyRatio: ScenarioMetricWithBudget;
  };
  capital?: {
    cet1: ScenarioMetricWithMinimum;
    tierOne: ScenarioMetricWithMinimum;
    totalCapital: ScenarioMetricWithMinimum;
    lcr: ScenarioMetricWithMinimum;
    nsfr: ScenarioMetricWithMinimum;
  };
  credit?: {
    nplRatio: ScenarioMetricWithPeer;
    provisionCoverageRatio: ScenarioMetricWithPeer;
    ncoRatio: ScenarioMetricWithPeer;
    concentrations: ConcentrationRisk[];
    watchlistMovements: WatchlistMovement[];
  };
  regulatory?: {
    mras: MRAItem[];
    exams: ExamItem[];
    auditCoverage?: AuditCoverageItem[];
  };
  incidents?: ScenarioIncident[];
}
