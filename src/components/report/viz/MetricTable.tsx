'use client';

import type { TableRow } from '@/data/agentDisplayData';

const PAD = '12px 20px';

const HL_BG: Record<string, string> = { red: '#FDEEF3', amber: '#FFF5D6', green: '#E1F5EE' };
const HL_C: Record<string, string> = { red: '#992A5C', amber: '#D7761D', green: '#0C7876' };

interface MetricTableProps {
  headers: string[];
  rows: TableRow[];
}

export function MetricTable({ headers, rows }: MetricTableProps) {
  return (
    <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: PAD, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#011E41', color: '#FFFFFF', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const bg = row.highlight && row.highlight !== 'none' ? HL_BG[row.highlight] ?? '#FFF' : i % 2 === 0 ? '#FFF' : '#FAFAFA';
            const color = row.highlight && row.highlight !== 'none' ? HL_C[row.highlight] ?? '#1A1A1A' : '#1A1A1A';
            return (
              <tr key={i} style={{ background: bg }}>
                <td style={{ padding: PAD, fontWeight: row.bold ? 700 : 600, color, borderBottom: '1px solid #F4F4F4' }}>{row.label}</td>
                {row.values.map((v, j) => (
                  <td key={j} style={{ padding: PAD, textAlign: 'right', fontWeight: row.bold ? 700 : 400, color, borderBottom: '1px solid #F4F4F4' }}>{v}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
