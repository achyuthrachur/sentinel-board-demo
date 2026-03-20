import type {
  FinancialMetrics,
  CapitalMetrics,
  CreditMetrics,
  TrendAnalysis,
  RAGStatus,
  MetricWithPriorBudget,
  MetricWithMinimum,
  MetricWithPeer,
} from '@/types/state';
import type { WhatIfControls, AdjustedMetrics } from '@/types/whatIf';

// ─── Baseline container ──────────────────────────────────────────────────────

export interface BaselineMetrics {
  financial: FinancialMetrics;
  capital: CapitalMetrics;
  credit: CreditMetrics;
  trend: TrendAnalysis;
}

// ─── RAG helpers ─────────────────────────────────────────────────────────────

function financialRag(nim: MetricWithPriorBudget, eff: MetricWithPriorBudget): RAGStatus {
  const nimVarPct = ((nim.value - nim.budget) / nim.budget) * 100;
  if (nimVarPct < -10 || eff.value > 65) return 'red';
  if (nimVarPct < -5 || eff.value > 60) return 'amber';
  return 'green';
}

function capitalRag(cet1: MetricWithMinimum, lcr: MetricWithMinimum): RAGStatus {
  if (cet1.value < cet1.minimum || lcr.value < 100) return 'red';
  if (cet1.wellCapitalized !== undefined && cet1.value < cet1.wellCapitalized) return 'amber';
  return 'green';
}

function creditRag(npl: MetricWithPeer, concentrations: { percentage: number; limit: number }[]): RAGStatus {
  const breaches = concentrations.filter((c) => c.percentage > c.limit).length;
  if (npl.value > npl.peerMedian * 1.5 || breaches > 0) return 'red';
  if (npl.value > npl.peerMedian) return 'amber';
  return 'green';
}

// ─── Computation ─────────────────────────────────────────────────────────────

export function computeAdjustedMetrics(
  baseline: BaselineMetrics,
  controls: WhatIfControls,
): AdjustedMetrics {
  const { sliders } = controls;

  // ── Financial adjustments ──────────────────────────────────────────────────

  const nimAdj = baseline.financial.nim.value + sliders.nimDelta / 100;
  const effAdj = baseline.financial.efficiencyRatio.value + sliders.efficiencyDelta;
  const niiAdj = baseline.financial.nonInterestIncome.value * (1 + sliders.nonInterestGrowth / 100);

  // Derived P&L
  const baseNIM = baseline.financial.nim.value;
  const baseEff = baseline.financial.efficiencyRatio.value;
  const baseNII = baseline.financial.nonInterestIncome.value;

  const roaDelta = (nimAdj * (1 - effAdj / 100)) - (baseNIM * (1 - baseEff / 100));
  const niiContrib = (niiAdj - baseNII) * 0.01;
  const roaAdj = baseline.financial.roa.value + roaDelta + niiContrib;

  // Capital for leverage calc
  const cet1Adj = baseline.capital.cet1.value + sliders.cet1Delta;
  const roeAdj = cet1Adj > 0 ? roaAdj * (100 / cet1Adj) : baseline.financial.roe.value;

  const adjNim: MetricWithPriorBudget = {
    ...baseline.financial.nim,
    value: nimAdj,
    variance: ((nimAdj - baseline.financial.nim.budget) / baseline.financial.nim.budget) * 100,
  };
  const adjEff: MetricWithPriorBudget = {
    ...baseline.financial.efficiencyRatio,
    value: effAdj,
    variance: ((effAdj - baseline.financial.efficiencyRatio.budget) / baseline.financial.efficiencyRatio.budget) * 100,
  };
  const adjRoa: MetricWithPriorBudget = {
    ...baseline.financial.roa,
    value: roaAdj,
    variance: ((roaAdj - baseline.financial.roa.budget) / baseline.financial.roa.budget) * 100,
  };
  const adjRoe: MetricWithPriorBudget = {
    ...baseline.financial.roe,
    value: roeAdj,
    variance: ((roeAdj - baseline.financial.roe.budget) / baseline.financial.roe.budget) * 100,
  };
  const adjNii: MetricWithPriorBudget = {
    ...baseline.financial.nonInterestIncome,
    value: niiAdj,
    variance: ((niiAdj - baseline.financial.nonInterestIncome.budget) / baseline.financial.nonInterestIncome.budget) * 100,
  };

  const financialMetrics: FinancialMetrics = {
    nim: adjNim,
    roa: adjRoa,
    roe: adjRoe,
    efficiencyRatio: adjEff,
    nonInterestIncome: adjNii,
    ragStatus: financialRag(adjNim, adjEff),
    flags: baseline.financial.flags,
  };

  // ── Capital adjustments ────────────────────────────────────────────────────

  const tier1Adj = baseline.capital.tierOne.value + sliders.cet1Delta;
  const totalCapAdj = baseline.capital.totalCapital.value + sliders.cet1Delta;
  const lcrAdj = baseline.capital.lcr.value + sliders.lcrDelta;

  const adjCet1: MetricWithMinimum = { ...baseline.capital.cet1, value: cet1Adj };
  const adjTier1: MetricWithMinimum = { ...baseline.capital.tierOne, value: tier1Adj };
  const adjTotalCap: MetricWithMinimum = { ...baseline.capital.totalCapital, value: totalCapAdj };
  const adjLcr: MetricWithMinimum = { ...baseline.capital.lcr, value: lcrAdj };

  const capitalMetrics: CapitalMetrics = {
    cet1: adjCet1,
    tierOne: adjTier1,
    totalCapital: adjTotalCap,
    lcr: adjLcr,
    nsfr: baseline.capital.nsfr,
    ragStatus: capitalRag(adjCet1, adjLcr),
    flags: baseline.capital.flags,
  };

  // ── Credit adjustments ─────────────────────────────────────────────────────

  const nplAdj = baseline.credit.nplRatio.value + sliders.nplDelta;
  const pcrAdj = baseline.credit.provisionCoverageRatio.value + sliders.provisionDelta;
  const ncoAdj = baseline.credit.ncoRatio.value + sliders.nplDelta * 0.3;

  const adjConcentrations = baseline.credit.concentrations.map((c) => ({
    ...c,
    percentage: c.segment === 'CRE' ? c.percentage + sliders.creDelta : c.percentage,
  }));

  const adjNpl: MetricWithPeer = { ...baseline.credit.nplRatio, value: nplAdj };
  const adjPcr: MetricWithPeer = { ...baseline.credit.provisionCoverageRatio, value: pcrAdj };
  const adjNco: MetricWithPeer = { ...baseline.credit.ncoRatio, value: ncoAdj };

  const creditMetrics: CreditMetrics = {
    nplRatio: adjNpl,
    provisionCoverageRatio: adjPcr,
    ncoRatio: adjNco,
    concentrations: adjConcentrations,
    watchlistMovements: baseline.credit.watchlistMovements,
    ragStatus: creditRag(adjNpl, adjConcentrations),
    flags: baseline.credit.flags,
  };

  // ── Trend extension (append projected 6th quarter) ─────────────────────────

  const trend: TrendAnalysis = {
    ...baseline.trend,
    nimTrend: [...baseline.trend.nimTrend, nimAdj],
    roaTrend: [...baseline.trend.roaTrend, roaAdj],
    roeTrend: [...baseline.trend.roeTrend, roeAdj],
    nplTrend: [...baseline.trend.nplTrend, nplAdj],
    efficiencyTrend: [...baseline.trend.efficiencyTrend, effAdj],
    cet1Trend: [...baseline.trend.cet1Trend, cet1Adj],
    quarters: [...baseline.trend.quarters, 'Proj.'],
  };

  // ── RAG domain summary ─────────────────────────────────────────────────────

  const ragDomains: AdjustedMetrics['ragDomains'] = [
    { label: 'Financial', status: financialMetrics.ragStatus },
    { label: 'Capital', status: capitalMetrics.ragStatus },
    { label: 'Credit', status: creditMetrics.ragStatus },
    { label: 'Trend', status: baseline.trend.ragStatus },
  ];

  return { financial: financialMetrics, capital: capitalMetrics, credit: creditMetrics, trend, ragDomains };
}
