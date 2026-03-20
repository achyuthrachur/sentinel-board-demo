import type { LeverConfig, ToggleConfig, WhatIfPreset, LeverKey, ToggleKey, WhatIfControls } from '@/types/whatIf';

// ─── 8 Slider Levers ─────────────────────────────────────────────────────────

export const LEVERS: LeverConfig[] = [
  { key: 'nimDelta',          label: 'NIM Change',        unit: 'bps', min: -50, max: 50,  step: 1,    default: 0, group: 'financial' },
  { key: 'efficiencyDelta',   label: 'Efficiency Ratio',  unit: 'pp',  min: -5,  max: 5,   step: 0.1,  default: 0, group: 'financial' },
  { key: 'nonInterestGrowth', label: 'Non-Int Income',    unit: '%',   min: -10, max: 10,  step: 0.5,  default: 0, group: 'financial' },
  { key: 'cet1Delta',         label: 'CET1 Ratio',        unit: 'pp',  min: -3,  max: 3,   step: 0.1,  default: 0, group: 'capital' },
  { key: 'lcrDelta',          label: 'LCR',               unit: 'pp',  min: -20, max: 20,  step: 1,    default: 0, group: 'capital' },
  { key: 'nplDelta',          label: 'NPL Ratio',         unit: 'pp',  min: -1,  max: 1,   step: 0.01, default: 0, group: 'credit' },
  { key: 'creDelta',          label: 'CRE Conc.',         unit: 'pp',  min: -50, max: 50,  step: 5,    default: 0, group: 'credit' },
  { key: 'provisionDelta',    label: 'Provision Coverage', unit: 'pp', min: -30, max: 30,  step: 1,    default: 0, group: 'credit' },
];

// ─── 3 Stress Toggles ────────────────────────────────────────────────────────

export const TOGGLES: ToggleConfig[] = [
  {
    key: 'rateShock',
    label: 'Rate Shock',
    description: 'NIM -30bps, Efficiency +2pp',
    effects: { nimDelta: -30, efficiencyDelta: 2 },
  },
  {
    key: 'creditStress',
    label: 'Credit Stress',
    description: 'NPL +0.5pp, Provision -15pp',
    effects: { nplDelta: 0.5, provisionDelta: -15 },
  },
  {
    key: 'recession',
    label: 'Recession',
    description: 'Rate Shock + Credit Stress + CET1 -1pp',
    effects: { nimDelta: -30, efficiencyDelta: 2, nplDelta: 0.5, provisionDelta: -15, cet1Delta: -1 },
  },
];

// ─── 6 Presets ───────────────────────────────────────────────────────────────

export const PRESETS: WhatIfPreset[] = [
  { id: 'baseline',      label: 'Baseline',      sliders: {},                                                                                              toggles: {} },
  { id: 'rate_shock',    label: 'Rate Shock',     sliders: { nimDelta: -30, efficiencyDelta: 2 },                                                          toggles: { rateShock: true } },
  { id: 'credit_stress', label: 'Credit Stress',  sliders: { nplDelta: 0.5, provisionDelta: -15 },                                                        toggles: { creditStress: true } },
  { id: 'recession',     label: 'Recession',      sliders: { nimDelta: -30, efficiencyDelta: 2, nplDelta: 0.5, provisionDelta: -15, cet1Delta: -1 },       toggles: { rateShock: true, creditStress: true, recession: true } },
  { id: 'optimistic',    label: 'Optimistic',     sliders: { nimDelta: 15, efficiencyDelta: -1.5, nonInterestGrowth: 3, cet1Delta: 0.5, nplDelta: -0.3 },  toggles: {} },
  { id: 'custom',        label: 'Custom',         sliders: {},                                                                                              toggles: {} },
];

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_SLIDERS: Record<LeverKey, number> = {
  nimDelta: 0,
  efficiencyDelta: 0,
  nonInterestGrowth: 0,
  cet1Delta: 0,
  lcrDelta: 0,
  nplDelta: 0,
  creDelta: 0,
  provisionDelta: 0,
};

export const DEFAULT_TOGGLES: Record<ToggleKey, boolean> = {
  rateShock: false,
  creditStress: false,
  recession: false,
};

export const DEFAULT_CONTROLS: WhatIfControls = {
  sliders: { ...DEFAULT_SLIDERS },
  toggles: { ...DEFAULT_TOGGLES },
};
