'use client';

import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import type { SwitchAnnotation as SwitchAnnotationType } from '@/store/executionStore';

interface SwitchAnnotationProps {
  annotation: SwitchAnnotationType | null;
}

export function SwitchAnnotation({ annotation }: SwitchAnnotationProps) {
  return (
    <AnimatePresence>
      {annotation && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(1,30,65,0.72)', backdropFilter: 'blur(2px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -8 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 22 }}
          >
            {/* Spinning icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                backgroundColor: 'rgba(245,168,0,0.12)',
                border: '1px solid rgba(245,168,0,0.3)',
              }}
            >
              <RefreshCw size={18} style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
            </motion.div>

            {/* Annotation text */}
            <div className="flex items-center gap-3">
              {/* From */}
              <div className="flex flex-col items-end">
                <span
                  className="text-[10px] font-medium uppercase tracking-widest opacity-50"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  from
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
                >
                  {annotation.fromCount}-node
                </span>
                <span
                  className="text-xs opacity-70"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {annotation.fromLabel}
                </span>
              </div>

              {/* Arrow */}
              <ArrowRight size={16} style={{ color: 'var(--accent)' }} />

              {/* To */}
              <div className="flex flex-col items-start">
                <span
                  className="text-[10px] font-medium uppercase tracking-widest opacity-50"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
                >
                  to
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
                >
                  rebuilding
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                >
                  {annotation.toLabel}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
