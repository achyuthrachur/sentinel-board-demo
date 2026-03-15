'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useIsolatedExecution } from '@/hooks/useIsolatedExecution';
import { CompareMiniCanvas } from './CompareMiniCanvas';

// Both executions start automatically when compare mode opens.
// Left: falcon-board (8 nodes, full HITL)   Right: risk-flash (3 nodes, compressed)

export function CompareView() {
  const left  = useIsolatedExecution();
  const right = useIsolatedExecution();

  useEffect(() => {
    void left.startExecution('falcon-board');
    void right.startExecution('risk-flash');
  // Run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Banner */}
      <motion.div
        className="flex shrink-0 items-center justify-center py-2.5"
        style={{
          backgroundColor: 'rgba(0,63,159,0.5)',
          borderBottom: '1px solid var(--border-active)',
          backdropFilter: 'blur(8px)',
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span
          className="text-xs font-bold uppercase tracking-[0.22em]"
          style={{
            color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
            textShadow: '0 0 20px rgba(245,168,0,0.35)',
          }}
        >
          Same system. Different meeting. Minimum viable intelligence.
        </span>
      </motion.div>

      {/* Two-pane canvas area */}
      <div className="flex flex-1 overflow-hidden">
        <CompareMiniCanvas
          execution={left}
          label="Falcon Board Q4"
          nodeCountHint={10}
          accent="var(--accent)"
        />
        <CompareMiniCanvas
          execution={right}
          label="Risk Flash Report"
          nodeCountHint={4}
          accent="var(--teal)"
        />
      </div>
    </div>
  );
}
