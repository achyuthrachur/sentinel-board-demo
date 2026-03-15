export const QUARTERS = ["Q4'23", "Q1'24", "Q2'24", "Q3'24", "Q4'24"] as const;

export const POPULATION_BASELINE = {
  nim:             [3.58, 3.52, 3.44, 3.44, 3.21],
  roa:             [0.94, 0.96, 0.98, 1.00, 1.02],
  roe:             [9.8,  10.0, 10.2, 10.5, 10.8],
  nplRatio:        [0.98, 1.12, 1.28, 1.41, 1.84],
  efficiencyRatio: [58.2, 58.9, 59.8, 60.4, 61.4],
  cet1Ratio:       [11.4, 11.2, 11.0, 10.9, 10.8],
  peerMedianNPL:   [1.05, 1.10, 1.15, 1.18, 1.20],
} as const;
