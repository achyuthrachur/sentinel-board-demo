'use client';

import { Handle, Position } from '@xyflow/react';
import { motion } from 'motion/react';
import type { NodeExecutionState } from '@/types/graph';

interface NodeShellProps {
  color: string;
  executionState: NodeExecutionState;
  children: React.ReactNode;
  hideSourceHandle?: boolean;
  hideTargetHandle?: boolean;
}

const handleStyle = {
  background: 'rgba(255,255,255,0.2)',
  border: '1px solid rgba(255,255,255,0.3)',
  width: 8,
  height: 8,
};

export function NodeShell({
  color,
  executionState,
  children,
  hideSourceHandle = false,
  hideTargetHandle = false,
}: NodeShellProps) {
  const isActive = executionState === 'active';
  const isCompleted = executionState === 'completed';
  const isPaused = executionState === 'paused';

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border-l-4"
      style={{
        width: 200,
        minHeight: 88,
        backgroundColor: 'var(--surface)',
        borderLeftColor: color,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
      animate={{
        opacity: executionState === 'idle' ? 0.42 : 1,
        boxShadow: isActive
          ? [
              `0 0 0px 0px ${color}00, 0 0 12px 2px ${color}40`,
              `0 0 0px 0px ${color}00, 0 0 26px 6px ${color}70`,
              `0 0 0px 0px ${color}00, 0 0 12px 2px ${color}40`,
            ]
          : isPaused
            ? [
                `0 0 0px 0px #E5376B00, 0 0 14px 3px #E5376B44`,
                `0 0 0px 0px #E5376B00, 0 0 22px 6px #E5376B70`,
                `0 0 0px 0px #E5376B00, 0 0 14px 3px #E5376B44`,
              ]
            : 'none',
      }}
      transition={
        isActive || isPaused
          ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.3 }
      }
    >
      {!hideTargetHandle && (
        <Handle type="target" position={Position.Left} style={handleStyle} />
      )}
      {!hideSourceHandle && (
        <Handle type="source" position={Position.Right} style={handleStyle} />
      )}

      {children}

      {/* Completed checkmark */}
      {isCompleted && (
        <div
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
          style={{ backgroundColor: color, color: '#011E41' }}
        >
          ✓
        </div>
      )}

      {/* Status dot */}
      <div className="flex items-center gap-1.5 px-3 pb-2">
        <motion.div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
          animate={
            isActive
              ? { opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }
              : { opacity: isCompleted ? 1 : 0.3 }
          }
          transition={
            isActive ? { duration: 1, repeat: Infinity } : { duration: 0.3 }
          }
        />
        <span
          className="text-[9px] uppercase tracking-widest"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          {executionState}
        </span>
      </div>
    </motion.div>
  );
}
