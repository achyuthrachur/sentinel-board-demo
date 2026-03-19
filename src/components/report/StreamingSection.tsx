'use client';

import { useEffect, useRef } from 'react';
import type { ReportSection } from '@/types/state';

const RAG_COLORS: Record<string, { bg: string; text: string; label: string; border: string }> = {
  red:   { bg: 'rgba(229,55,107,0.08)', text: '#E5376B', label: 'RED',   border: 'rgba(229,55,107,0.2)' },
  amber: { bg: 'rgba(245,168,0,0.08)',  text: '#F5A800', label: 'AMBER', border: 'rgba(245,168,0,0.2)' },
  green: { bg: 'rgba(5,171,140,0.08)',  text: '#05AB8C', label: 'GREEN', border: 'rgba(5,171,140,0.2)' },
};

// ─── Lightweight markdown renderer ───────────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  // Bold **text**, italic *text*, inline code `text`
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code key={match.index} style={{ background: '#F0F0F0', padding: '1px 5px', borderRadius: 3, fontSize: '0.9em', fontFamily: 'var(--font-mono)' }}>
          {match[4]}
        </code>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

function MarkdownTable({ lines }: { lines: string[] }) {
  // Parse header row, separator, and body rows
  const parseRow = (line: string) =>
    line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);

  const headers = parseRow(lines[0]);
  const bodyLines = lines.slice(2); // skip separator

  return (
    <div style={{ overflowX: 'auto', marginBottom: 20, borderRadius: 8, border: '1px solid #E0E0E0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: '10px 14px',
                textAlign: i === 0 ? 'left' : 'right',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: '#011E41',
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyLines.map((line, ri) => {
            const cells = parseRow(line);
            // Detect RAG-colored rows
            const rowText = line.toLowerCase();
            const isRed = rowText.includes('flag') || rowText.includes('breach') || rowText.includes('overdue') || rowText.includes('⚠');
            const isGreen = rowText.includes('pass') || rowText.includes('✓') || rowText.includes('ok');
            const bg = isRed ? 'rgba(229,55,107,0.05)' : isGreen ? 'rgba(5,171,140,0.04)' : ri % 2 === 0 ? '#FFFFFF' : '#FAFAFA';

            return (
              <tr key={ri} style={{ background: bg }}>
                {cells.map((cell, ci) => (
                  <td key={ci} style={{
                    padding: '9px 14px',
                    textAlign: ci === 0 ? 'left' : 'right',
                    fontWeight: ci === 0 ? 600 : 400,
                    color: '#333',
                    borderBottom: '1px solid #F0F0F0',
                    fontSize: 13,
                  }}>
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Table — starts with |
    if (line.trim().startsWith('|') && i + 1 < lines.length && lines[i + 1]?.trim().startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<MarkdownTable key={`t-${i}`} lines={tableLines} />);
      continue;
    }

    // H3 subsection header
    if (line.trim().startsWith('### ')) {
      elements.push(
        <h3 key={`h-${i}`} style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#011E41',
          margin: '24px 0 10px',
          letterSpacing: '-0.01em',
        }}>
          {renderInline(line.trim().slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} style={{
          margin: '14px 0',
          padding: '12px 18px',
          borderLeft: '3px solid #F5A800',
          background: 'rgba(245,168,0,0.06)',
          borderRadius: '0 8px 8px 0',
          fontSize: 14,
          lineHeight: 1.7,
          color: '#333',
        }}>
          {quoteLines.map((ql, qi) => <span key={qi}>{renderInline(ql)}{qi < quoteLines.length - 1 && <br />}</span>)}
        </blockquote>
      );
      continue;
    }

    // Bullet list
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bullets: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        bullets.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '10px 0 14px', paddingLeft: 24, lineHeight: 1.75 }}>
          {bullets.map((b, bi) => (
            <li key={bi} style={{ marginBottom: 4, fontSize: 14, color: '#4F4F4F' }}>
              {renderInline(b)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '10px 0 14px', paddingLeft: 24, lineHeight: 1.75 }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ marginBottom: 4, fontSize: 14, color: '#4F4F4F' }}>
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('### ') &&
      !lines[i].trim().startsWith('> ') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('* ') &&
      !/^\d+\.\s/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      elements.push(
        <p key={`p-${i}`} style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.75, color: '#4F4F4F' }}>
          {renderInline(paraLines.join(' '))}
        </p>
      );
    }
  }

  return <>{elements}</>;
}

// ─── Streaming Section ───────────────────────────────────────────────────────

interface StreamingSectionProps {
  section: ReportSection;
  index: number;
  isActive: boolean;
  sectionRef?: (el: HTMLDivElement | null) => void;
}

export function StreamingSection({ section, index, isActive, sectionRef }: StreamingSectionProps) {
  const rag = section.ragStatus ? RAG_COLORS[section.ragStatus] : null;
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!cursorRef.current) return;
    cursorRef.current.style.opacity = section.isStreaming ? '1' : '0';
  }, [section.isStreaming]);

  return (
    <div
      id={`section-${section.id}`}
      ref={sectionRef}
      style={{ marginBottom: 40 }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `2px solid ${isActive ? '#011E41' : '#E0E0E0'}`,
          paddingBottom: 10,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: '#BDBDBD',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              minWidth: 24,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: '#011E41',
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {section.title}
          </h2>
          {section.isStreaming && (
            <span
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: '#F5A800',
                letterSpacing: '0.08em',
                animation: 'pulse 1.2s ease-in-out infinite',
              }}
            >
              STREAMING
            </span>
          )}
        </div>
        {rag && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              padding: '3px 10px',
              borderRadius: 3,
              background: rag.bg,
              color: rag.text,
              border: `1px solid ${rag.border}`,
              flexShrink: 0,
            }}
          >
            {rag.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div>
        {section.content ? (
          <>
            <MarkdownContent content={section.content} />
            {section.isStreaming && (
              <span
                ref={cursorRef}
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: '1em',
                  background: '#011E41',
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                  animation: 'blink 0.8s step-end infinite',
                }}
              />
            )}
          </>
        ) : (
          section.isStreaming ? (
            <p style={{ margin: '0 0 14px 0', color: '#BDBDBD' }}>
              <span
                ref={cursorRef}
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: '1em',
                  background: '#011E41',
                  verticalAlign: 'text-bottom',
                  animation: 'blink 0.8s step-end infinite',
                }}
              />
            </p>
          ) : (
            <p style={{ margin: 0, color: '#BDBDBD', fontStyle: 'italic' }}>No content.</p>
          )
        )}
      </div>

      {/* Legacy metrics table if present */}
      {section.metrics && Object.keys(section.metrics).length > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid #E0E0E0', paddingTop: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(section.metrics).map(([key, val]) => (
              <div
                key={key}
                style={{
                  background: '#F4F4F4',
                  border: '1px solid #E0E0E0',
                  borderRadius: 4,
                  padding: '5px 10px',
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#828282', fontFamily: 'var(--font-mono)', marginRight: 6 }}>
                  {key}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#011E41', fontFamily: 'var(--font-mono)' }}>
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
