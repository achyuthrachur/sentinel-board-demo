'use client';

import type { SparkLine } from '@/data/agentDisplayData';
import type { TrendAnalysis } from '@/types/state';
import { POPULATION_BASELINE, QUARTERS } from '@/data/populationBaseline';

interface SparklinePanelPropsFromDisplay {
  sparkLines: SparkLine[];
  projectedIndex?: number;
}

interface SparklinePanelPropsFromState {
  trendAnalysis: TrendAnalysis;
  projectedIndex?: number;
}

type SparklinePanelProps = SparklinePanelPropsFromDisplay | SparklinePanelPropsFromState;

function isDisplayProps(p: SparklinePanelProps): p is SparklinePanelPropsFromDisplay {
  return 'sparkLines' in p;
}

function trendToSparkLines(trend: TrendAnalysis): SparkLine[] {
  const quarters = trend.quarters?.length ? trend.quarters : [...QUARTERS];
  const entries: { label: string; key: keyof typeof POPULATION_BASELINE; unit: string; color: string; data: number[] }[] = [
    { label: 'Net Interest Margin', key: 'nim', unit: '%', color: '#E5376B', data: trend.nimTrend },
    { label: 'Return on Assets', key: 'roa', unit: '%', color: '#54C0E8', data: trend.roaTrend },
    { label: 'Return on Equity', key: 'roe', unit: '%', color: '#B14FC5', data: trend.roeTrend },
    { label: 'NPL Ratio', key: 'nplRatio', unit: '%', color: '#E5376B', data: trend.nplTrend },
    { label: 'Efficiency Ratio', key: 'efficiencyRatio', unit: '%', color: '#F5A800', data: trend.efficiencyTrend },
    { label: 'CET1 Ratio', key: 'cet1Ratio', unit: '%', color: '#05AB8C', data: trend.cet1Trend },
  ];

  return entries
    .filter((e) => e.data?.length > 0)
    .map((e) => {
      const vals = e.data;
      const first = vals[0];
      const last = vals[vals.length - 1];
      const delta = last - first;
      const trend: SparkLine['trend'] = Math.abs(delta) < 0.05 ? 'flat' : delta > 0 ? 'up' : 'down';
      const sign = delta >= 0 ? '+' : '';
      return {
        label: e.label,
        unit: e.unit,
        color: e.color,
        trend,
        trendLabel: `${sign}${delta.toFixed(2)}${e.unit} over ${vals.length - 1}Q`,
        points: vals.map((v, i) => ({ quarter: quarters[i] ?? `Q${i}`, value: v })),
      };
    });
}

export function SparklinePanel(props: SparklinePanelProps) {
  const sparkLines = isDisplayProps(props) ? props.sparkLines : trendToSparkLines(props.trendAnalysis);
  const projectedIndex = props.projectedIndex;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
      {sparkLines.map((sl) => {
        const h = 80, padX = 24, padY = 16;
        const vals = sl.points.map((p) => p.value);
        const min = Math.min(...vals) * 0.95, max = Math.max(...vals) * 1.05;
        const range = max - min || 1;

        // Compute coordinates for all points
        const coords = sl.points.map((p, i) => ({
          x: padX + (i / (sl.points.length - 1)) * (400 - 2 * padX),
          y: padY + (1 - (p.value - min) / range) * (h - 2 * padY),
        }));

        // Split solid and projected segments
        const hasProjection = projectedIndex !== undefined && projectedIndex > 0 && projectedIndex < sl.points.length;
        const solidEnd = hasProjection ? projectedIndex : sl.points.length;

        const solidPath = coords.slice(0, solidEnd).map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
        const fullPath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
        const fillPath = fullPath + ` L ${coords[coords.length - 1].x} ${h} L ${coords[0].x} ${h} Z`;

        // Dashed segment from solidEnd-1 to projectedIndex
        const dashedPath = hasProjection
          ? `M ${coords[solidEnd - 1].x} ${coords[solidEnd - 1].y} L ${coords[projectedIndex].x} ${coords[projectedIndex].y}`
          : null;

        return (
          <div key={sl.label} style={{ padding: '18px 22px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#011E41' }}>{sl.label}</span>
              <span style={{ fontSize: 12, color: sl.color, fontWeight: 600 }}>{sl.trendLabel}</span>
            </div>
            <svg width="100%" viewBox={`0 0 400 ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
              <path d={fillPath} fill={`${sl.color}12`} />
              <path d={solidPath} fill="none" stroke={sl.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {dashedPath && (
                <path d={dashedPath} fill="none" stroke={sl.color} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="6 4" opacity={0.7} />
              )}
              {coords.map((c, i) => {
                const isProjected = hasProjection && i === projectedIndex;
                return (
                  <g key={i}>
                    <circle cx={c.x} cy={c.y} r={4}
                      fill={isProjected ? 'transparent' : '#FFF'}
                      stroke={sl.color} strokeWidth={2}
                      strokeDasharray={isProjected ? '3 2' : undefined}
                    />
                    <text x={c.x} y={c.y - 10} textAnchor="middle" fill={isProjected ? sl.color : '#1A1A1A'} fontSize={10} fontWeight={isProjected ? 700 : 400}>
                      {Number(sl.points[i].value).toFixed(2)}{sl.unit}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginTop: 8, padding: '0 8px' }}>
              {sl.points.map((p, i) => (
                <span key={p.quarter} style={hasProjection && i === projectedIndex ? { color: '#F5A800', fontWeight: 700 } : undefined}>
                  {p.quarter}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
