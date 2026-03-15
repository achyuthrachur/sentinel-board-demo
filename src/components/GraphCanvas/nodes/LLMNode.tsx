'use client';

import type { NodeProps } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { LLMNodeData } from '@/types/graph';
import { NodeShell } from './NodeShell';

function ThinkingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.18,
            ease: 'easeInOut',
          }}
        />
      ))}
      <span
        className="ml-1 text-[9px] uppercase tracking-widest"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
      >
        thinking
      </span>
    </div>
  );
}

export function LLMNode({ data: rawData }: NodeProps) {
  const { label, badgeLabel, color, executionState, durationMs, tokenCount } =
    rawData as unknown as LLMNodeData;
  const isActive = executionState === 'active';

  return (
    <NodeShell color={color} executionState={executionState}>
      <div className="px-3 pt-3">
        {/* Top row: icon + badge */}
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles size={11} style={{ color }} strokeWidth={2.5} />
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color, fontFamily: 'var(--font-mono)' }}
          >
            {badgeLabel}
          </span>
        </div>

        {/* Label */}
        <p
          className="mb-2 text-sm font-bold leading-tight text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {label}
        </p>

        {/* Thinking indicator when active */}
        {isActive && (
          <div className="mb-2">
            <ThinkingIndicator color={color} />
          </div>
        )}

        {/* Token count + duration on complete */}
        {executionState === 'completed' && (
          <div className="flex gap-2">
            {tokenCount !== undefined && (
              <p
                className="text-[9px]"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {tokenCount}t
              </p>
            )}
            {durationMs !== undefined && (
              <p
                className="text-[9px]"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                {durationMs}ms
              </p>
            )}
          </div>
        )}
      </div>
    </NodeShell>
  );
}
