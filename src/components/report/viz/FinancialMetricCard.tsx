'use client';

import type { MetricWithPriorBudget, RAGStatus } from '@/types/state';

const RAG_COLORS: Record<RAGStatus, string> = {
  red:   '#E5376B',
  amber: '#F5A800',
  green: '#05AB8C',
};

function getVarianceStatus(variance: number): RAGStatus {
  if (variance >= 0) return 'green';
  if (variance >= -5) return 'amber';
  return 'red';
}

function fmt(v: number): string {
  return `${v.toFixed(2)}%`;
}

interface FinancialMetricCardProps {
  label: string;
  metric: MetricWithPriorBudget;
}

export function FinancialMetricCard({ label, metric }: FinancialMetricCardProps) {
  const varianceStatus = getVarianceStatus(metric.variance);
  const varianceColor = RAG_COLORS[varianceStatus];
  const prefix = metric.variance >= 0 ? '+' : '';

  return (
    <div style={{
      padding: '18px 22px',
      background: '#FAFAFA',
      borderRadius: 12,
      border: '1px solid #E0E0E0',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#011E41', fontFamily: 'var(--font-display)' }}>
          {fmt(metric.value)}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
          padding: '3px 8px',
          borderRadius: 10,
          background: `${varianceColor}15`,
          color: varianceColor,
          border: `1px solid ${varianceColor}30`,
        }}>
          {prefix}{metric.variance.toFixed(1)}% vs budget
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#666' }}>
        <span>Budget <strong style={{ color: '#1A1A1A' }}>{fmt(metric.budget)}</strong></span>
        <span>Prior <strong style={{ color: '#1A1A1A' }}>{fmt(metric.priorPeriod)}</strong></span>
      </div>
    </div>
  );
}
