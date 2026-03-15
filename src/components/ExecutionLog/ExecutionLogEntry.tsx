'use client';

/* Aesthetic direction: Swiss / typographic */

import { Brain, GitMerge, Hash, PauseCircle, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

import type { ExecutionLogEntry as ExecutionLogEntryType, NodeType } from '@/types/state';
import { cn } from '@/lib/utils';

const NODE_META: Record<
  NodeType,
  {
    color: string;
    Icon: typeof Hash;
  }
> = {
  deterministic: { color: '#0075C9', Icon: Hash },
  algorithmic: { color: '#05AB8C', Icon: TrendingUp },
  hybrid: { color: '#54C0E8', Icon: GitMerge },
  llm: { color: '#F5A800', Icon: Sparkles },
  orchestrator: { color: '#B14FC5', Icon: Brain },
  human: { color: '#E5376B', Icon: PauseCircle },
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function truncateSummary(summary: string, maxLength = 60): string {
  if (summary.length <= maxLength) {
    return summary;
  }

  return `${summary.slice(0, maxLength - 3).trimEnd()}...`;
}

function getLoopNumber(summary: string): string | null {
  const match = summary.match(/Loop\s+(\d+)/i);
  return match?.[1] ?? null;
}

export function ExecutionLogEntry({
  entry,
}: {
  entry: ExecutionLogEntryType;
}) {
  const isHitl = entry.nodeType === 'human';
  const loopNumber = getLoopNumber(entry.summary);
  const isLoop = entry.label === 'Loop back' || loopNumber !== null;
  const { color, Icon } = NODE_META[entry.nodeType];
  const displaySummary = truncateSummary(entry.summary);
  const accentColor = isHitl || isLoop ? '#E5376B' : color;
  const borderColor = isHitl || isLoop ? 'rgba(229, 55, 107, 0.55)' : undefined;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex min-w-[240px] flex-col gap-2 rounded-lg border border-white/8 border-l-[3px] bg-surface p-3',
        isLoop && 'border-dashed',
      )}
      style={{
        borderLeftColor: accentColor,
        borderColor,
        backgroundColor: isHitl ? 'rgba(153, 42, 92, 0.28)' : 'var(--surface)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="truncate text-[11px] leading-none"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          {formatTimestamp(entry.timestamp)}
        </span>

        {entry.durationMs !== undefined ? (
          <span
            className="shrink-0 text-[10px] leading-none"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            {entry.durationMs}ms
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-md border"
          style={{
            color,
            borderColor: `${color}55`,
            backgroundColor: `${color}1A`,
          }}
        >
          <Icon size={12} strokeWidth={2.25} />
        </span>

        <p
          className="truncate text-[13px] leading-none text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {entry.label}
        </p>

        {isLoop && loopNumber ? (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none"
            style={{
              color: 'var(--coral)',
              border: '1px solid rgba(229, 55, 107, 0.4)',
              backgroundColor: 'rgba(229, 55, 107, 0.14)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Loop {loopNumber}
          </span>
        ) : null}
      </div>

      <p
        className="text-[11px] leading-[1.35]"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
      >
        {displaySummary}
      </p>
    </motion.article>
  );
}
