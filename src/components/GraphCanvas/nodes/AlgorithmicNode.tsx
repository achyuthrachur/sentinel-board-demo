'use client';

import type { NodeProps } from '@xyflow/react';
import { TrendingUp } from 'lucide-react';
import type { AlgorithmicNodeData } from '@/types/graph';
import { NodeShell } from './NodeShell';

export function AlgorithmicNode({ data: rawData }: NodeProps) {
  const { label, badgeLabel, color, executionState, formulaHint, durationMs, scoreOutput } =
    rawData as unknown as AlgorithmicNodeData;

  return (
    <NodeShell color={color} executionState={executionState}>
      <div className="px-3 pt-3">
        {/* Top row: icon + badge */}
        <div className="mb-2 flex items-center gap-1.5">
          <TrendingUp size={11} style={{ color }} strokeWidth={2.5} />
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
            className="mb-1 text-[9px] leading-tight"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            {formulaHint}
          </p>
        )}

        {/* Score output */}
        {scoreOutput !== undefined && executionState === 'completed' && (
          <p
            className="text-[10px] font-bold"
            style={{ color, fontFamily: 'var(--font-mono)' }}
          >
            Score: {scoreOutput.toFixed(2)}
          </p>
        )}

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
