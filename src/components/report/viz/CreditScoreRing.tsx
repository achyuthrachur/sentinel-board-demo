'use client';

import type { CreditMetrics, RAGStatus } from '@/types/state';

const RAG_COLORS: Record<RAGStatus, string> = {
  red:   '#E5376B',
  amber: '#F5A800',
  green: '#05AB8C',
};

function computeCreditScore(metrics: CreditMetrics): number {
  const scoreNpl =
    metrics.nplRatio.value < metrics.nplRatio.peerMedian ? 1
      : metrics.nplRatio.value < metrics.nplRatio.peerMedian * 1.2 ? 0 : -1;

  const scorePcr =
    metrics.provisionCoverageRatio.value > metrics.provisionCoverageRatio.peerMedian ? 1
      : metrics.provisionCoverageRatio.value > metrics.provisionCoverageRatio.peerMedian * 0.8 ? 0 : -1;

  const scoreNco =
    metrics.ncoRatio.value < metrics.ncoRatio.peerMedian ? 1
      : metrics.ncoRatio.value < metrics.ncoRatio.peerMedian * 1.2 ? 0 : -1;

  const breaches = metrics.concentrations.filter((c) => c.percentage > c.limit).length;
  const scoreConcentration = breaches === 0 ? 1 : breaches === 1 ? 0 : -1;

  const rawScore = (0.35 * scoreNpl + 0.25 * scorePcr + 0.2 * scoreNco + 0.2 * scoreConcentration) * 5;
  return Math.max(0, Math.min(100, Math.round(((rawScore + 5) / 10) * 100)));
}

interface CreditScoreRingProps {
  metrics: CreditMetrics;
}

export function CreditScoreRing({ metrics }: CreditScoreRingProps) {
  const score = computeCreditScore(metrics);
  const color = RAG_COLORS[metrics.ragStatus];
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
      {/* Ring */}
      <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={radius} stroke="#E0E0E0" strokeWidth="7" fill="transparent" />
          <circle
            cx="50" cy="50" r={radius}
            stroke={color} strokeWidth="7" strokeLinecap="round" fill="transparent"
            strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.7s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#011E41', fontFamily: 'var(--font-display)' }}>{score}</span>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)' }}>score</span>
        </div>
      </div>

      {/* Details */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Credit quality</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#011E41', marginBottom: 12 }}>Peer and concentration signal</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ padding: '10px 14px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)' }}>NPL</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#011E41', marginTop: 2 }}>{metrics.nplRatio.value.toFixed(2)}%</div>
          </div>
          <div style={{ padding: '10px 14px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)' }}>Watchlist</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#011E41', marginTop: 2 }}>{metrics.watchlistMovements.length}</div>
          </div>
        </div>

        {/* Concentration table */}
        {metrics.concentrations.length > 0 && (
          <div style={{ marginTop: 12, display: 'grid', gap: 2 }}>
            {metrics.concentrations.map((c) => {
              const breach = c.percentage > c.limit;
              return (
                <div key={c.segment} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 14px', fontSize: 12, borderRadius: 6,
                  background: breach ? '#FDEEF3' : '#FAFAFA',
                }}>
                  <span style={{ color: '#1A1A1A' }}>{c.segment}</span>
                  <span style={{
                    fontWeight: 700,
                    color: breach ? '#992A5C' : '#0C7876',
                    fontSize: 11,
                  }}>
                    {c.percentage}% / {c.limit}% {breach ? 'BREACH' : 'OK'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
