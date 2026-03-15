'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown, CheckCircle2, MinusCircle } from 'lucide-react';
import { useExecutionStore } from '@/store/executionStore';
import { NODE_REGISTRY } from '@/data/nodeRegistry';

const ALL_NODE_IDS = Object.keys(NODE_REGISTRY);

// Node type → display badge color
const TYPE_COLORS: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

export function GraphDiffPanel() {
  const nodes = useExecutionStore((s) => s.nodes);
  const [open, setOpen] = useState(true);

  if (!nodes.length) return null;

  const activeIds = new Set(nodes.map((n) => n.id));
  const selected = ALL_NODE_IDS.filter((id) => activeIds.has(id));
  const skipped  = ALL_NODE_IDS.filter((id) => !activeIds.has(id));

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2 transition-colors hover:bg-white/5"
        style={{ backgroundColor: 'rgba(0,46,98,0.92)', backdropFilter: 'blur(8px)' }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          Graph Topology Diff — {selected.length} selected · {skipped.length} skipped
        </span>
        {open
          ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          : <ChevronUp   size={14} style={{ color: 'var(--text-muted)' }} />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="diff-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
            style={{ backgroundColor: 'rgba(0,46,98,0.92)', backdropFilter: 'blur(8px)' }}
          >
            <div className="grid grid-cols-2 gap-px px-4 pb-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
              {/* SELECTED column */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={11} style={{ color: '#05AB8C' }} />
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: '#05AB8C', fontFamily: 'var(--font-mono)' }}
                  >
                    Selected ({selected.length})
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {selected.map((id) => {
                    const meta = NODE_REGISTRY[id];
                    if (!meta) return null;
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: TYPE_COLORS[meta.type] ?? '#fff' }}
                        />
                        <span
                          className="text-[11px] font-medium truncate"
                          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="ml-auto text-[9px] font-bold uppercase tracking-wider shrink-0"
                          style={{ color: TYPE_COLORS[meta.type] ?? '#fff', fontFamily: 'var(--font-mono)', opacity: 0.8 }}
                        >
                          {meta.badgeLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NOT REQUIRED column */}
              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
                <div className="mb-2 flex items-center gap-1.5">
                  <MinusCircle size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}
                  >
                    Not Required ({skipped.length})
                  </span>
                </div>
                {skipped.length === 0 ? (
                  <p
                    className="text-[11px] italic opacity-40"
                    style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    All nodes active
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {skipped.map((id) => {
                      const meta = NODE_REGISTRY[id];
                      if (!meta) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 opacity-35">
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[meta.type] ?? '#fff' }}
                          />
                          <span
                            className="text-[11px] font-medium truncate line-through"
                            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                          >
                            {meta.label}
                          </span>
                          <span
                            className="ml-auto text-[9px] font-bold uppercase tracking-wider shrink-0"
                            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                          >
                            {meta.badgeLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
