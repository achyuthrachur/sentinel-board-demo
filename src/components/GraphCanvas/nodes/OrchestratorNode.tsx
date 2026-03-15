'use client';

import type { NodeProps } from '@xyflow/react';
import { Brain } from 'lucide-react';
import { motion } from 'motion/react';
import type { OrchestratorNodeData } from '@/types/graph';
import { NodeShell } from './NodeShell';

export function OrchestratorNode({ data: rawData }: NodeProps) {
  const { label, badgeLabel, color, executionState, decision, loopCount } =
    rawData as unknown as OrchestratorNodeData;
  const isActive = executionState === 'active';

  return (
    <NodeShell color={color} executionState={executionState}>
      <div className="px-3 pt-3">
        {/* Top row: icon + badge */}
        <div className="mb-2 flex items-center gap-1.5">
          <motion.div
            animate={isActive ? { rotate: [0, 15, -15, 0] } : {}}
            transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
          >
            <Brain size={11} style={{ color }} strokeWidth={2.5} />
          </motion.div>
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

        {/* Decision output */}
        {decision && executionState === 'completed' && (
          <p
            className="mb-1 truncate text-[9px]"
            style={{ color, fontFamily: 'var(--font-mono)' }}
          >
            → {decision}
          </p>
        )}

        {/* Loop count */}
        {loopCount !== undefined && loopCount > 0 && (
          <p
            className="text-[9px]"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            Loop #{loopCount}
          </p>
        )}
      </div>
    </NodeShell>
  );
}
