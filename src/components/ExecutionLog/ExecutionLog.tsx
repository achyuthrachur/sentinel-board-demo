'use client';

/* Aesthetic direction: Swiss / typographic */

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';

import { useExecutionStore } from '@/store/executionStore';
import { ExecutionLogEntry } from './ExecutionLogEntry';

export function ExecutionLog() {
  const executionLog = useExecutionStore((state) => state.executionLog);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      left: container.scrollWidth,
      behavior: executionLog.length > 1 ? 'smooth' : 'auto',
    });
  }, [executionLog.length]);

  if (executionLog.length === 0) {
    return (
      <div
        className="flex h-full items-center rounded-lg border border-dashed px-4"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-muted)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }}
      >
        Awaiting execution events
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex h-full flex-row gap-3 overflow-x-auto overflow-y-hidden pb-1 pr-1"
    >
      <AnimatePresence initial={false}>
        {executionLog.map((entry, index) => (
          <ExecutionLogEntry
            key={`${entry.timestamp}-${entry.nodeId}-${entry.summary}-${index}`}
            entry={entry}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
