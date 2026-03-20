'use client';

import type { MetricGauge } from '@/data/agentDisplayData';
import type { MetricWithMinimum } from '@/types/state';

interface GaugeBarPropsFromDisplay {
  gauges: MetricGauge[];
}

interface GaugeBarPropsFromState {
  metrics: { label: string; metric: MetricWithMinimum }[];
}

type GaugeBarProps = GaugeBarPropsFromDisplay | GaugeBarPropsFromState;

function isDisplayProps(p: GaugeBarProps): p is GaugeBarPropsFromDisplay {
  return 'gauges' in p;
}

function stateToGauges(metrics: { label: string; metric: MetricWithMinimum }[]): MetricGauge[] {
  return metrics.map(({ label, metric }) => {
    const scaleMax = Math.max(metric.value, metric.wellCapitalized ?? metric.minimum, metric.minimum * 1.4);
    const fillPct = Math.min((metric.value / scaleMax) * 100, 100);
    const status: MetricGauge['status'] =
      metric.value < metric.minimum ? 'red'
        : (metric.wellCapitalized !== undefined && metric.value < metric.wellCapitalized) ? 'amber'
          : metric.value < metric.minimum + 1.5 ? 'amber' : 'green';

    return {
      label,
      actual: metric.value,
      actualLabel: `${metric.value.toFixed(1)}%`,
      minimum: metric.minimum,
      minimumLabel: `${metric.minimum.toFixed(1)}% min`,
      wellCapitalized: metric.wellCapitalized,
      wellCapLabel: metric.wellCapitalized !== undefined ? `${metric.wellCapitalized.toFixed(1)}% well-cap` : undefined,
      fillPct,
      status,
    };
  });
}

export function GaugeBar(props: GaugeBarProps) {
  const gauges = isDisplayProps(props) ? props.gauges : stateToGauges(props.metrics);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
      {gauges.map((g) => {
        const fill = g.status === 'green' ? '#05AB8C' : g.status === 'amber' ? '#F5A800' : '#E5376B';
        return (
          <div key={g.label} style={{ padding: '18px 22px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#011E41' }}>{g.label}</span>
              <span style={{ fontSize: 18, color: fill, fontWeight: 700 }}>{g.actualLabel}</span>
            </div>
            <div style={{ height: 6, background: '#E0E0E0', borderRadius: 3, position: 'relative' }}>
              <div style={{ height: '100%', width: `${Math.min(g.fillPct, 100)}%`, background: fill, borderRadius: 3, transition: 'width 0.8s ease' }} />
              <div style={{ position: 'absolute', left: `${(g.minimum / (g.actual * 1.3)) * 100}%`, top: -3, bottom: -3, width: 2, background: '#E5376B', borderRadius: 1 }} />
              {g.wellCapitalized !== undefined && (
                <div style={{ position: 'absolute', left: `${(g.wellCapitalized / (g.actual * 1.3)) * 100}%`, top: -3, bottom: -3, width: 2, background: '#05AB8C', borderRadius: 1 }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#666', marginTop: 8 }}>
              <span>min {g.minimumLabel}</span>
              {g.wellCapLabel && <span>well-cap {g.wellCapLabel}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
