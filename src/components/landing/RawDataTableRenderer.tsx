'use client';

import type { RawDataTable } from '@/data/agentRawInputData';

interface RawDataTableRendererProps {
  table: RawDataTable;
  compact?: boolean;
  dark?: boolean;
}

const LIGHT_STATUS: Record<string, React.CSSProperties> = {
  breach:  { background: '#FDEEF3', color: '#992A5C', fontWeight: 700 },
  flag:    { background: '#FFF5D6', color: '#D7761D' },
  ok:      { background: '#E1F5EE', color: '#0C7876' },
  overdue: { background: '#FDEEF3', color: '#992A5C', fontWeight: 700 },
  dim:     { color: '#BDBDBD' },
};

const DARK_STATUS: Record<string, React.CSSProperties> = {
  breach:  { background: 'rgba(229,55,107,0.15)', color: '#FF7096', fontWeight: 700 },
  flag:    { background: 'rgba(245,168,0,0.12)', color: '#FFD066' },
  ok:      { background: 'rgba(5,171,140,0.12)', color: '#5DDBB5' },
  overdue: { background: 'rgba(229,55,107,0.15)', color: '#FF7096', fontWeight: 700 },
  dim:     { color: 'rgba(255,255,255,0.7)' },
};

/* ── Shared padding constants ── */
const PAD = {
  cell:        { paddingTop: 12, paddingRight: 20, paddingBottom: 12, paddingLeft: 20 },
  cellCompact: { paddingTop: 8,  paddingRight: 14, paddingBottom: 8,  paddingLeft: 14 },
} as const;

export function RawDataTableRenderer({ table, compact = false, dark = false }: RawDataTableRendererProps) {
  const fontSize = compact ? 12 : 13;
  const headerFontSize = compact ? 10 : 11;
  const pad = compact ? PAD.cellCompact : PAD.cell;
  const statusMap = dark ? DARK_STATUS : LIGHT_STATUS;

  // Color tokens
  const c = dark ? {
    title: '#FFFFFF',
    source: '#FFFFFF',
    headerBg: 'rgba(255,255,255,0.06)',
    headerText: '#FFFFFF',
    border: 'rgba(255,255,255,0.08)',
    rowEven: 'transparent',
    rowOdd: 'rgba(255,255,255,0.02)',
    cellText: '#FFFFFF',
    cellBorder: 'rgba(255,255,255,0.04)',
    sectionBg: 'rgba(255,255,255,0.04)',
    sectionText: '#FFFFFF',
    separatorBorder: 'rgba(255,255,255,0.1)',
    footnote: '#FFFFFF',
    footnoteBorder: 'rgba(255,255,255,0.06)',
  } : {
    title: '#011E41',
    source: '#828282',
    headerBg: '#011E41',
    headerText: '#FFFFFF',
    border: '#E0E0E0',
    rowEven: '#FFFFFF',
    rowOdd: '#FAFAFA',
    cellText: '#333333',
    cellBorder: '#F4F4F4',
    sectionBg: '#F4F4F4',
    sectionText: '#828282',
    separatorBorder: '#BDBDBD',
    footnote: '#828282',
    footnoteBorder: '#E0E0E0',
  };

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Title + source meta */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: c.title, marginBottom: 3, fontFamily: 'var(--font-body)' }}>
          {table.title}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: c.source }}>
          <span>{table.sourceLabel}</span>
          <span>&middot;</span>
          <span>As of {table.asOfDate}</span>
        </div>
      </div>

      {/* Full-width table */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${c.border}` }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize,
            fontFamily: 'var(--font-body)',
            tableLayout: 'auto',
          }}
        >
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: i === 0 || i === table.headers.length - 1 ? 'left' : 'right',
                    ...pad,
                    fontSize: headerFontSize,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: c.headerBg,
                    color: c.headerText,
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    borderBottom: `1px solid ${c.border}`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIdx) => {
              if (row.sectionHeader) {
                const label = row.cells[0]?.value ?? '';
                return (
                  <tr key={rowIdx}>
                    <td
                      colSpan={table.headers.length}
                      style={{
                        background: c.sectionBg,
                        color: c.sectionText,
                        fontSize: headerFontSize,
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        ...pad,
                        borderTop: rowIdx > 0 ? `1px solid ${c.border}` : undefined,
                      }}
                    >
                      {label}
                    </td>
                  </tr>
                );
              }

              const isEven = rowIdx % 2 === 0;
              return (
                <tr
                  key={rowIdx}
                  style={{
                    background: isEven ? c.rowEven : c.rowOdd,
                    borderTop: row.separator ? `1px solid ${c.separatorBorder}` : undefined,
                  }}
                >
                  {row.cells.map((cell, cellIdx) => {
                    const statusStyle = cell.status && cell.status !== 'normal' ? statusMap[cell.status] ?? {} : {};
                    // Base left pad is 20px; indent adds on top of that
                    const extraIndent = cell.indent === 2 ? 28 : cell.indent === 1 ? 16 : 0;

                    return (
                      <td
                        key={cellIdx}
                        style={{
                          ...pad,
                          textAlign: cellIdx === 0 || cellIdx === row.cells.length - 1 ? 'left' : 'right',
                          fontWeight: cell.bold ? 700 : undefined,
                          fontFamily: 'var(--font-body)',
                          borderBottom: `1px solid ${c.cellBorder}`,
                          color: c.cellText,
                          ...statusStyle,
                        }}
                      >
                        <span style={cellIdx === 0 && extraIndent > 0 ? { marginLeft: extraIndent } : undefined}>
                          {cell.value}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      {table.footnote && (
        <div
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            color: c.footnote,
            fontStyle: 'italic',
            paddingTop: 10,
            borderTop: `1px solid ${c.footnoteBorder}`,
            marginTop: 10,
          }}
        >
          {table.footnote}
        </div>
      )}
    </div>
  );
}
