'use client';

import type { NodeProps } from '@xyflow/react';
import { GitMerge } from 'lucide-react';
import type { HybridNodeData } from '@/types/graph';
import { NodeShell } from './NodeShell';

export function HybridNode({ data: rawData }: NodeProps) {
  const { label, badgeLabel, color, executionState, durationMs } =
    rawData as unknown as HybridNodeData;

  return (
    <NodeShell color={color} executionState={executionState}>
      <div className="px-3 pt-3">
        {/* Top row: icon + badge */}
        <div className="mb-2 flex items-center gap-1.5">
          <GitMerge size={11} style={{ color }} strokeWidth={2.5} />
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

        {/* Hybrid type indicator */}
        <div className="mb-2 flex gap-1">
          <span
            className="rounded px-1 py-0.5 text-[8px] uppercase tracking-wide"
            style={{
              backgroundColor: '#0075C920',
              color: '#0075C9',
              fontFamily: 'var(--font-mono)',
            }}
          >
            stats
          </span>
          <span
            className="rounded px-1 py-0.5 text-[8px] uppercase tracking-wide"
            style={{
              backgroundColor: `${color}20`,
              color,
              fontFamily: 'var(--font-mono)',
            }}
          >
            llm
          </span>
        </div>

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
