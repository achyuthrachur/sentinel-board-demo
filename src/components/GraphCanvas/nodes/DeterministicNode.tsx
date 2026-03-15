'use client';

import type { NodeProps } from '@xyflow/react';
import { Hash } from 'lucide-react';
import type { DeterministicNodeData } from '@/types/graph';
import { NodeShell } from './NodeShell';

export function DeterministicNode({ data: rawData }: NodeProps) {
  const { label, badgeLabel, color, executionState, formulaHint, durationMs } =
    rawData as unknown as DeterministicNodeData;

  return (
    <NodeShell color={color} executionState={executionState}>
      <div className="px-3 pt-3">
        {/* Top row: icon + badge */}
        <div className="mb-2 flex items-center gap-1.5">
          <Hash size={11} style={{ color }} strokeWidth={2.5} />
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

        {/* Formula hint */}
        {formulaHint && (
          <p
            className="mb-2 text-[9px] leading-tight"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            {formulaHint}
          </p>
        )}

        {/* Duration */}
        {durationMs !== undefined && executionState === 'completed' && (
          <p
            className="text-[9px]"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            {durationMs}ms
          </p>
        )}
      </div>
    </NodeShell>
  );
}
