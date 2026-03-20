'use client';

import type { RAGStatus } from '@/types/state';

const RAG_COLORS: Record<RAGStatus, string> = {
  red:   '#E5376B',
  amber: '#F5A800',
  green: '#05AB8C',
};

interface RagStripProps {
  domains: { label: string; status: RAGStatus | null | undefined }[];
}

export function RagStrip({ domains }: RagStripProps) {
  const visible = domains.filter((d) => d.status != null);
  if (visible.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24, padding: '16px 20px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0E0E0' }}>
      {visible.map((d) => {
        const color = RAG_COLORS[d.status!];
        return (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 8px ${color}60`,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#011E41', letterSpacing: '0.02em' }}>{d.label}</span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              padding: '2px 8px',
              borderRadius: 3,
              background: `${color}15`,
              color,
            }}>
              {d.status!.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
