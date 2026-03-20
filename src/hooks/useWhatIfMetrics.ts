import { useMemo } from 'react';
import { useExecutionStore } from '@/store/executionStore';
import { useWhatIfStore } from '@/store/whatIfStore';
import { computeAdjustedMetrics, type BaselineMetrics } from '@/lib/whatIf/computeAdjustedMetrics';
import type { AdjustedMetrics } from '@/types/whatIf';

export function useWhatIfMetrics(): {
  isActive: boolean;
  adjusted: AdjustedMetrics | null;
  baseline: BaselineMetrics | null;
} {
  const liveState = useExecutionStore((s) => s.liveState);
  const isActive = useWhatIfStore((s) => s.isWhatIfActive);
  const controls = useWhatIfStore((s) => s.controls);

  const baseline = useMemo<BaselineMetrics | null>(() => {
    const fm = liveState.financialMetrics;
    const cm = liveState.capitalMetrics;
    const cr = liveState.creditMetrics;
    const trend = liveState.trendAnalysis;
    if (!fm || !cm || !cr || !trend) return null;
    return { financial: fm, capital: cm, credit: cr, trend };
  }, [liveState.financialMetrics, liveState.capitalMetrics, liveState.creditMetrics, liveState.trendAnalysis]);

  const adjusted = useMemo(() => {
    if (!isActive || !baseline) return null;
    return computeAdjustedMetrics(baseline, controls);
  }, [isActive, baseline, controls]);

  return { isActive, adjusted, baseline };
}
