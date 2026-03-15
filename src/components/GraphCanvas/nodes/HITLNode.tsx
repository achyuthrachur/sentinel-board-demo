'use client';

import type { NodeProps } from '@xyflow/react';
import { UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import type { HITLNodeData } from '@/types/graph';
import { NodeShell } from './NodeShell';

export function HITLNode({ data: rawData }: NodeProps) {
  const { label, badgeLabel, color, executionState, hitlDecision } =
    rawData as unknown as HITLNodeData;
  const isPaused = executionState === 'paused';

  return (
    <NodeShell color={color} executionState={executionState}>
      <div className="px-3 pt-3">
        {/* Top row: icon + badge */}
        <div className="mb-2 flex items-center gap-1.5">
          <UserCheck size={11} style={{ color }} strokeWidth={2.5} />
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color, fontFamily: 'var(--font-mono)' }}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Label */}
        <p
          className="mb-1 text-sm font-bold leading-tight text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label}
        </p>

        {/* Awaiting review badge */}
        {isPaused && (
          <motion.div
            className="mb-2 inline-flex items-center rounded px-1.5 py-0.5"
            style={{ backgroundColor: `${color}22`, border: `1px solid ${color}66` }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color, fontFamily: 'var(--font-mono)' }}
            >
              Awaiting Review
            </span>
          </motion.div>
        )}

        {/* Decision outcome */}
        {hitlDecision && hitlDecision !== 'pending' && (
          <p
            className="text-[9px] font-bold uppercase"
            style={{
              color: hitlDecision === 'approved' ? '#05AB8C' : '#F5A800',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {hitlDecision === 'approved' ? '✓ Approved' : '↩ Revised'}
          </p>
        )}
      </div>
    </NodeShell>
  );
}
