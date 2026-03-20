'use client';

import type { DecisionRow } from '@/data/agentDisplayData';

const PAD = '12px 20px';

const FS: Record<string, { bg: string; color: string; icon: string }> = {
  critical: { bg: '#FDEEF3', color: '#992A5C', icon: '\u26A0\u26A0' },
  warning:  { bg: '#FFF5D6', color: '#D7761D', icon: '\u26A0' },
  ok:       { bg: '#E1F5EE', color: '#0C7876', icon: '\u2713' },
};

interface DecisionGridProps {
  rows: DecisionRow[];
  decision?: string;
  rationale?: string;
}

export function DecisionGrid({ rows, decision, rationale }: DecisionGridProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'grid', gap: 2 }}>
        {rows.map((r, i) => {
          const f = r.flag ? FS[r.flag] : null;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: PAD, background: f ? f.bg : '#FAFAFA', borderRadius: 8 }}>
              <span style={{ fontSize: 14, color: '#1A1A1A' }}>{r.input}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: f?.color ?? '#1A1A1A' }}>{r.value}</span>
                {f && <span style={{ fontSize: 11, background: f.bg, color: f.color, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>{f.icon}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {decision && (
        <div style={{ marginTop: 16, padding: '18px 22px', background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.2)', borderRadius: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#011E41', marginBottom: 6 }}>{decision}</div>
          {rationale && <div style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 1.7 }}>{rationale}</div>}
        </div>
      )}
    </div>
  );
}
