'use client';

import { Download } from 'lucide-react';
import type { ReportSection } from '@/types/state';

const RAG_DOT: Record<string, string> = {
  red:   '#E5376B',
  amber: '#F5A800',
  green: '#05AB8C',
};

interface ReportTOCProps {
  sections: ReportSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onDownload: () => void;
  canDownload: boolean;
  executionLog: Array<{ label: string; durationMs?: number }>;
}

export function ReportTOC({ sections, activeIndex, onSelect, onDownload, canDownload, executionLog }: ReportTOCProps) {
  return (
    <div
      style={{
        background: '#001833',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Package contents · {sections.length} sections
        </div>
      </div>

      {/* Section list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {sections.map((section, i) => {
          const isActive = i === activeIndex;
          const dotColor = section.ragStatus ? RAG_DOT[section.ragStatus] : null;
          const isPending = !section.isComplete && !section.isStreaming;
          const isStreaming = section.isStreaming;

          return (
            <div
              key={section.id}
              onClick={() => onSelect(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px',
                cursor: 'pointer',
                borderLeft: `3px solid ${isActive ? '#F5A800' : 'transparent'}`,
                background: isActive ? 'rgba(245,168,0,0.06)' : 'transparent',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'var(--font-mono)',
                  minWidth: 18,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: isPending
                    ? 'rgba(255,255,255,0.5)'
                    : isActive
                    ? '#F5A800'
                    : 'rgba(255,255,255,0.6)',
                  flex: 1,
                  fontWeight: isActive ? 700 : 400,
                  lineHeight: 1.3,
                }}
              >
                {section.title || '—'}
              </span>
              {/* Status indicator */}
              {isStreaming ? (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#F5A800',
                    boxShadow: '0 0 5px #F5A800',
                    flexShrink: 0,
                    animation: 'pulse 1s ease-in-out infinite',
                  }}
                />
              ) : dotColor ? (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: dotColor,
                    flexShrink: 0,
                    opacity: isPending ? 0.2 : 1,
                  }}
                />
              ) : null}
            </div>
          );
        })}

        {/* Placeholder rows while streaming hasn't started yet */}
        {sections.length === 0 && (
          Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 16px',
              }}
            >
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-mono)', minWidth: 18 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div
                style={{
                  height: 10,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.05)',
                  flex: 1,
                }}
              />
            </div>
          ))
        )}
      </div>

      {/* Agent run times */}
      {executionLog.filter((e) => e.durationMs !== undefined).length > 0 && (
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 16px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-mono)',
              marginBottom: 8,
            }}
          >
            Agent run times
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {executionLog
              .filter((e) => e.durationMs !== undefined)
              .map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#FFFFFF',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginRight: 6,
                    }}
                  >
                    {entry.label}
                  </span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {entry.durationMs}ms
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Download DOCX CTA */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 14px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onDownload}
          disabled={!canDownload}
          style={{
            width: '100%',
            height: 38,
            background: canDownload ? '#F5A800' : 'rgba(245,168,0,0.15)',
            border: canDownload ? 'none' : '1px solid rgba(245,168,0,0.2)',
            borderRadius: 5,
            color: canDownload ? '#011E41' : 'rgba(245,168,0,0.4)',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: canDownload ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          <Download size={13} />
          Download DOCX
        </button>
      </div>
    </div>
  );
}
