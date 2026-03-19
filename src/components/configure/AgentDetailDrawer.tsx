'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentRawInput } from '@/data/agentRawInputData';
import { getAgentDisplayData } from '@/data/agentDisplayData';
import { RawDataTableRenderer } from '@/components/landing/RawDataTableRenderer';
import {
  Network, TrendingUp, Shield, BarChart3, Activity,
  FileText, AlertTriangle, GitBranch, UserCheck, BookOpen,
  type LucideIcon,
} from 'lucide-react';

const AGENT_ICONS: Record<string, LucideIcon> = {
  meta_agent: Network, financial_aggregator: TrendingUp, capital_monitor: Shield,
  credit_quality: BarChart3, trend_analyzer: Activity, regulatory_digest: FileText,
  operational_risk: AlertTriangle, supervisor: GitBranch, hitl_gate: UserCheck,
  report_compiler: BookOpen,
};

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

// ─── Drawer ──────────────────────────────────────────────────────────────────

interface AgentDetailDrawerProps {
  agentId: string | null;
  onClose: () => void;
}

export function AgentDetailDrawer({ agentId, onClose }: AgentDetailDrawerProps) {
  const agent = agentId ? NODE_REGISTRY[agentId] : null;
  const rawInput = agentId ? getAgentRawInput(agentId) : null;
  const displayData = agentId ? getAgentDisplayData(agentId) : null;
  const color = agent ? TYPE_COLOR[agent.type] ?? agent.color : '#8FE1FF';
  const Icon = agentId ? AGENT_ICONS[agentId] ?? Network : Network;

  return (
    <AnimatePresence>
      {agentId && agent && (
        <motion.div
          key={agentId}
          initial={{ x: '100%', opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 480,
            background: 'linear-gradient(180deg, #001530 0%, #011E41 100%)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '24px 0 0 24px',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '-12px 0 48px rgba(0,0,0,0.2)',
          }}
        >
          {/* ── Header: icon + title + description ── */}
          <div style={{ padding: '24px 28px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
                  style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(135deg, ${color}25, ${color}10)`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon size={24} color={color} strokeWidth={1.5} />
                </motion.div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, background: `${color}12`, padding: '4px 12px', borderRadius: 20, border: `1px solid ${color}20` }}>{agent.badgeLabel}</span>
              </div>
              <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    <X size={16} />
                  </button>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.15, fontFamily: 'var(--font-display)' }}
            >
              {agent.label}
            </motion.h2>

            {displayData?.explanation && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 10, lineHeight: 1.7, margin: '10px 0 0' }}
              >
                {displayData.explanation}
              </motion.p>
            )}

            {displayData?.note && (
              <div style={{ marginTop: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: '#FFD066', background: 'rgba(245,168,0,0.08)', border: '1px solid rgba(245,168,0,0.12)', borderRadius: 12, padding: '10px 14px', lineHeight: 1.5 }}>{displayData.note}</div>
            )}
          </div>

          {/* ── Section label ── */}
          <div style={{ padding: '0 28px 12px', flexShrink: 0 }}>
            <div style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)',
            }}>
              Raw Source Data
            </div>
          </div>

          {/* ── Scrollable raw data content ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 28px 28px' }}>
            {rawInput && (
              <motion.div key="raw" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {rawInput.keyFields && rawInput.keyFields.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 20, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {rawInput.keyFields.map((kf, i) => (
                      <div key={i}>
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>{kf.label}</div>
                        <div style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 600 }}>{kf.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {rawInput.tables.map((table) => (
                  <RawDataTableRenderer key={table.id} table={table} compact dark />
                ))}
              </motion.div>
            )}
            {!rawInput && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'var(--font-body)' }}>No raw input data available for this agent.</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
