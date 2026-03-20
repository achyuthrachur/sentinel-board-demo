import type { RAGStatus, FinancialMetrics, CapitalMetrics, CreditMetrics, TrendAnalysis } from './state';

// ─── Lever & Toggle Keys ─────────────────────────────────────────────────────

export type LeverKey =
  | 'nimDelta'
  | 'efficiencyDelta'
  | 'nonInterestGrowth'
  | 'cet1Delta'
  | 'lcrDelta'
  | 'nplDelta'
  | 'creDelta'
  | 'provisionDelta';

export type ToggleKey = 'rateShock' | 'creditStress' | 'recession';

export type PresetId = 'baseline' | 'rate_shock' | 'credit_stress' | 'recession' | 'optimistic' | 'custom';

export type LeverGroup = 'financial' | 'capital' | 'credit';

// ─── Config Types ────────────────────────────────────────────────────────────

export interface LeverConfig {
  key: LeverKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  group: LeverGroup;
}

export interface ToggleConfig {
  key: ToggleKey;
  label: string;
  description: string;
  effects: Partial<Record<LeverKey, number>>;
}

export interface WhatIfPreset {
  id: PresetId;
  label: string;
  sliders: Partial<Record<LeverKey, number>>;
  toggles: Partial<Record<ToggleKey, boolean>>;
}

// ─── Controls State ──────────────────────────────────────────────────────────

export interface WhatIfControls {
  sliders: Record<LeverKey, number>;
  toggles: Record<ToggleKey, boolean>;
}

// ─── Adjusted Metrics Output ─────────────────────────────────────────────────

export interface AdjustedMetrics {
  financial: FinancialMetrics;
  capital: CapitalMetrics;
  credit: CreditMetrics;
  trend: TrendAnalysis;
  ragDomains: { label: string; status: RAGStatus }[];
}
