'use client';

import { motion, AnimatePresence } from 'motion/react';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentRawInput } from '@/data/agentRawInputData';
import { getAgentDisplayData } from '@/data/agentDisplayData';
import { RawDataTableRenderer } from './RawDataTableRenderer';

/* ── Shared padding constant ── */
const PAD = '12px 20px';

// ─── Main component ──────────────────────────────────────────────────────────

interface AgentDataPanelProps {
  agentId: string | null;
}

export function AgentDataPanel({ agentId }: AgentDataPanelProps) {
  const agent = agentId ? NODE_REGISTRY[agentId] : null;
  const rawInput = agentId ? getAgentRawInput(agentId) : null;
  const displayData = agentId ? getAgentDisplayData(agentId) : null;

  return (
    <div style={{ perspective: '1200px', perspectiveOrigin: '50% 0%' }}>
    <AnimatePresence mode="wait">
      {agentId && agent && (
        <motion.div
          key={agentId}
          style={{ transformOrigin: 'top center' }}
          initial={{ opacity: 0, rotateX: -22, scaleY: 0.88 }}
          animate={{ opacity: 1, rotateX: 0, scaleY: 1 }}
          exit={{ opacity: 0, rotateX: -22, scaleY: 0.88 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Peel shadow strip */}
          <div style={{
            height: 32,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 100%)',
            marginBottom: -32,
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'none',
          }} />

          <div style={{ background: '#F7F8FA', padding: '48px 0' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 clamp(24px, 5vw, 80px)' }}>

              {/* Agent header */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25, ease: 'easeOut' }}
                style={{ marginBottom: 32 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: agent.color }} />
                  <h3 style={{
                    fontSize: 28, fontWeight: 700, color: '#011E41',
                    fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0,
                  }}>
                    {agent.label}
                  </h3>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: agent.color, background: `${agent.color}15`,
                    padding: '4px 12px', borderRadius: 4,
                  }}>
                    {agent.badgeLabel}
                  </span>
                </div>
                {displayData?.explanation && (
                  <p style={{
                    fontSize: 16, fontFamily: 'var(--font-body)', color: '#4F4F4F', lineHeight: 1.7,
                    margin: 0, maxWidth: 720, paddingLeft: 18,
                  }}>
                    {displayData.explanation}
                  </p>
                )}
              </motion.div>

              {/* Section label */}
              <div style={{
                borderBottom: '1px solid #E0E0E0',
                marginBottom: 32,
                paddingBottom: 12,
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 700, color: '#011E41',
                  fontFamily: 'var(--font-body)',
                  borderBottom: '2px solid #F5A800',
                  paddingBottom: 12,
                }}>
                  Raw Input Data
                </span>
              </div>

              {/* Raw data content */}
              <AnimatePresence mode="wait">
                {rawInput && (
                  <motion.div
                    key="raw"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Key fields as stat cards */}
                    {rawInput.keyFields && rawInput.keyFields.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 12,
                        marginBottom: 32,
                      }}>
                        {rawInput.keyFields.map((kf, i) => (
                          <div key={i} style={{
                            padding: PAD,
                            background: '#FFFFFF',
                            borderRadius: 10,
                            border: '1px solid #E0E0E0',
                          }}>
                            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#828282', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                              {kf.label}
                            </div>
                            <div style={{ fontSize: 16, fontFamily: 'var(--font-body)', color: '#011E41', fontWeight: 600 }}>{kf.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tables */}
                    {rawInput.tables.map((table) => (
                      <RawDataTableRenderer key={table.id} table={table} />
                    ))}
                  </motion.div>
                )}

                {!rawInput && (
                  <motion.div key="no-raw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p style={{ color: '#828282', fontSize: 14, fontFamily: 'var(--font-body)' }}>No raw input data available for this agent.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
