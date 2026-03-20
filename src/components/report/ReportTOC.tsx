'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { useExecutionStore } from '@/store/executionStore';
import { useWhatIfStore } from '@/store/whatIfStore';
import { WhatIfLeverPanel } from '@/components/report/WhatIfLeverPanel';
import type { ReportSection } from '@/types/state';

const RAG_DOT: Record<string, string> = {
  red:   '#E5376B',
  amber: '#F5A800',
  green: '#05AB8C',
};

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

type TOCView = 'dashboard' | 'report' | 'agents';

const DASHBOARD_SECTIONS = [
  { id: 'rag-overview', label: 'RAG Overview' },
  { id: 'financial-performance', label: 'Financial Performance' },
  { id: 'capital-liquidity', label: 'Capital & Liquidity' },
  { id: 'credit-quality', label: 'Credit Quality' },
  { id: 'trend-analysis', label: 'Trend Analysis' },
  { id: 'regulatory-status', label: 'Regulatory Status' },
  { id: 'operational-risk', label: 'Operational Risk' },
  { id: 'kpi-scorecard', label: 'KPI Scorecard' },
];

interface ReportTOCProps {
  sections: ReportSection[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onDownload: () => void;
  canDownload: boolean;
  executionLog: Array<{ label: string; nodeId?: string; durationMs?: number }>;
  tocView: TOCView;
  onTOCViewChange: (view: TOCView) => void;
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  agentNodeIds: string[];
}

export function ReportTOC({
  sections, activeIndex, onSelect, onDownload, canDownload, executionLog,
  tocView, onTOCViewChange, selectedAgentId, onSelectAgent, agentNodeIds,
}: ReportTOCProps) {
  const isWhatIfActive = useWhatIfStore((s) => s.isWhatIfActive);
  const toggleWhatIf = useWhatIfStore((s) => s.toggleWhatIf);

  // What-If requires all 4 core metric agents to have run
  const liveState = useExecutionStore((s) => s.liveState);
  const whatIfAvailable = !!(liveState.financialMetrics && liveState.capitalMetrics && liveState.creditMetrics && liveState.trendAnalysis);
  const [showWhatIfHint, setShowWhatIfHint] = useState(false);

  const handleWhatIfClick = () => {
    if (whatIfAvailable || isWhatIfActive) {
      toggleWhatIf();
      setShowWhatIfHint(false);
    } else {
      setShowWhatIfHint(true);
      setTimeout(() => setShowWhatIfHint(false), 4000);
    }
  };

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
      {/* Toggle: Dashboard / Report / Agents */}
      <div style={{ padding: '12px 14px 8px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)',
          borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {([
            { id: 'dashboard' as TOCView, label: 'Dashboard' },
            { id: 'report' as TOCView, label: 'Report' },
            { id: 'agents' as TOCView, label: 'Agents' },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTOCViewChange(t.id)}
              style={{
                flex: 1, height: 30, border: 'none', borderRadius: 8,
                background: tocView === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: tocView === t.id ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                fontWeight: tocView === t.id ? 700 : 500,
                fontSize: 11, fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ padding: '6px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
            {tocView === 'dashboard'
              ? (isWhatIfActive ? 'What-If Analysis' : 'Executive dashboard')
              : tocView === 'report'
              ? `Package contents · ${sections.length} sections`
              : `Agent outputs · ${agentNodeIds.length} agents`}
          </div>
          {tocView === 'dashboard' && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={handleWhatIfClick}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: 'none',
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: whatIfAvailable || isWhatIfActive ? 'pointer' : 'default',
                  background: isWhatIfActive ? '#F5A800' : 'rgba(255,255,255,0.08)',
                  color: isWhatIfActive ? '#011E41' : whatIfAvailable ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.15s ease',
                  opacity: whatIfAvailable || isWhatIfActive ? 1 : 0.6,
                }}
              >
                {isWhatIfActive ? 'Exit' : 'What-If'}
              </button>
              {showWhatIfHint && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  padding: '8px 12px',
                  background: '#1A1A2E',
                  border: '1px solid rgba(245,168,0,0.3)',
                  borderRadius: 6,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1.5,
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}>
                  Requires Financial, Capital, Credit &amp; Trend agents
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>

        {/* ── Dashboard sections or What-If lever panel ── */}
        {tocView === 'dashboard' && isWhatIfActive && (
          <WhatIfLeverPanel />
        )}
        {tocView === 'dashboard' && !isWhatIfActive && DASHBOARD_SECTIONS.map((ds, i) => (
          <div
            key={ds.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', cursor: 'default',
              borderLeft: '3px solid transparent',
            }}
          >
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', minWidth: 18 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 12, flex: 1, lineHeight: 1.3, color: '#FFFFFF', fontWeight: 400 }}>
              {ds.label}
            </span>
          </div>
        ))}

        {/* ── Report sections ── */}
        {tocView === 'report' && sections.map((section, i) => {
          const isActive = i === activeIndex;
          const dotColor = section.ragStatus ? RAG_DOT[section.ragStatus] : null;
          const isPending = !section.isComplete && !section.isStreaming;
          const isStreaming = section.isStreaming;

          return (
            <div
              key={section.id}
              onClick={() => onSelect(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 16px', cursor: 'pointer',
                borderLeft: `3px solid ${isActive ? '#F5A800' : 'transparent'}`,
                background: isActive ? 'rgba(245,168,0,0.06)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', minWidth: 18 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{
                fontSize: 12, flex: 1, lineHeight: 1.3,
                color: isPending ? 'rgba(255,255,255,0.5)' : isActive ? '#F5A800' : '#FFFFFF',
                fontWeight: isActive ? 700 : 400,
              }}>
                {section.title || '—'}
              </span>
              {isStreaming ? (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5A800', boxShadow: '0 0 5px #F5A800', flexShrink: 0, animation: 'pulse 1s ease-in-out infinite' }} />
              ) : dotColor ? (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0, opacity: isPending ? 0.2 : 1 }} />
              ) : null}
            </div>
          );
        })}

        {/* Report placeholders */}
        {tocView === 'report' && sections.length === 0 && (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-mono)', minWidth: 18 }}>{String(i + 1).padStart(2, '0')}</span>
              <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.05)', flex: 1 }} />
            </div>
          ))
        )}

        {/* ── Agent list ── */}
        {tocView === 'agents' && agentNodeIds.map((nodeId) => {
          const agent = NODE_REGISTRY[nodeId];
          if (!agent) return null;
          const isActive = selectedAgentId === nodeId;
          const color = TYPE_COLOR[agent.type] ?? agent.color;

          return (
            <div
              key={nodeId}
              onClick={() => onSelectAgent(nodeId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', cursor: 'pointer',
                borderLeft: `3px solid ${isActive ? color : 'transparent'}`,
                background: isActive ? `${color}10` : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>
                  {agent.label}
                </div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {agent.badgeLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent run times (report view only) */}
      {(tocView === 'report' || tocView === 'dashboard') && executionLog.filter((e) => e.durationMs !== undefined).length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>Agent run times</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {executionLog
              .filter((e) => e.durationMs !== undefined)
              .map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#FFFFFF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 6 }}>{entry.label}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{entry.durationMs}ms</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Download DOCX CTA */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 14px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onDownload}
          disabled={!canDownload}
          style={{
            width: '100%', height: 38,
            background: canDownload ? '#F5A800' : 'rgba(245,168,0,0.15)',
            border: canDownload ? 'none' : '1px solid rgba(245,168,0,0.2)',
            borderRadius: 5, color: canDownload ? '#011E41' : 'rgba(245,168,0,0.4)',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            cursor: canDownload ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <Download size={13} />
          Download DOCX
        </button>
      </div>
    </div>
  );
}
