'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TextAnimate } from '@/components/ui/text-animate';
import { useExecutionStore } from '@/store/executionStore';
import { MessageSquare } from 'lucide-react';

// ─── Card shape ───────────────────────────────────────────────────────────────

interface NarrationCard {
  id: string;
  text: string;
  accentColor: string;
}

// ─── Accent per node type ────────────────────────────────────────────────────

const NODE_ACCENT: Record<string, string> = {
  financial_aggregator: '#0075C9',
  credit_quality:       '#05AB8C',
  supervisor:           '#B14FC5',
  hitl_gate:            '#E5376B',
  report_compiler:      '#F5A800',
};

const DISMISS_AFTER_MS = 4000;

// ─── Component ────────────────────────────────────────────────────────────────

export function NarrationOverlay() {
  const executionLog      = useExecutionStore((s) => s.executionLog);
  const isPaused          = useExecutionStore((s) => s.isPaused);
  const isComplete        = useExecutionStore((s) => s.isComplete);
  const selectedScenarioId = useExecutionStore((s) => s.selectedScenarioId);
  const nodes             = useExecutionStore((s) => s.nodes);

  const [current, setCurrent] = useState<NarrationCard | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef  = useRef<Set<string>>(new Set());

  const showNarration = useCallback((card: NarrationCard) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent(card);
    timerRef.current = setTimeout(() => setCurrent(null), DISMISS_AFTER_MS);
  }, []);

  // Reset fired set when a new run starts (log goes back to 0)
  useEffect(() => {
    if (executionLog.length === 0) {
      firedRef.current.clear();
      if (timerRef.current) clearTimeout(timerRef.current);
      setCurrent(null);
    }
  }, [executionLog.length]);

  // ── Watch executionLog for node-level triggers ──────────────────────────────
  useEffect(() => {
    if (!executionLog.length) return;
    const last = executionLog[executionLog.length - 1];
    const key  = `${last.nodeId}|${last.timestamp}|${last.summary}`;
    if (firedRef.current.has(key)) return;
    firedRef.current.add(key);

    // financial_aggregator completed
    if (last.nodeId === 'financial_aggregator' && last.summary !== 'Started') {
      showNarration({
        id: key,
        text: 'This node runs pure arithmetic — no AI. NIM variance and efficiency ratios are deterministic calculations.',
        accentColor: NODE_ACCENT.financial_aggregator,
      });
      return;
    }

    // credit_quality completed
    if (last.nodeId === 'credit_quality' && last.summary !== 'Started') {
      showNarration({
        id: key,
        text: 'Credit health scored using a weighted algorithm. Weights are hardcoded and auditable.',
        accentColor: NODE_ACCENT.credit_quality,
      });
      return;
    }

    // supervisor LOOP_BACK (summary format: "Loop N: fromNode → toNode")
    if (last.label === 'Loop back' && last.summary.startsWith('Loop')) {
      const match = last.summary.match(/Loop (\d+): \S+ → (\S+)/);
      const n      = match?.[1] ?? '1';
      const toNode = (match?.[2] ?? 'previous node').replace(/_/g, ' ');
      showNarration({
        id: key,
        text: `Supervisor re-routing to ${toNode} for deeper analysis. Loop ${n} of 2.`,
        accentColor: NODE_ACCENT.supervisor,
      });
      return;
    }

    // hitl_gate started
    if (last.nodeId === 'hitl_gate' && last.summary === 'Started') {
      showNarration({
        id: key,
        text: 'Execution paused. CFO approval required before compilation.',
        accentColor: NODE_ACCENT.hitl_gate,
      });
      return;
    }
  }, [executionLog, showNarration]);

  // ── Watch isPaused for HITL (belt-and-suspenders) ─────────────────────────
  const prevPausedRef = useRef(false);
  useEffect(() => {
    if (isPaused && !prevPausedRef.current) {
      const key = `hitl-paused-${Date.now()}`;
      if (!firedRef.current.has('hitl-gate-started')) {
        // Only fire if executionLog trigger didn't already catch it
        firedRef.current.add(key);
        showNarration({
          id: key,
          text: 'Execution paused. CFO approval required before compilation.',
          accentColor: NODE_ACCENT.hitl_gate,
        });
      }
    }
    prevPausedRef.current = isPaused;
  }, [isPaused, showNarration]);

  // ── Watch isComplete ────────────────────────────────────────────────────────
  const prevCompleteRef = useRef(false);
  useEffect(() => {
    if (!isComplete || prevCompleteRef.current) return;
    prevCompleteRef.current = true;

    const key = `complete-${selectedScenarioId}`;
    if (firedRef.current.has(key)) return;
    firedRef.current.add(key);

    const nodeCount = nodes.length;

    // Duration from executionLog timestamps
    let durationStr = '';
    if (executionLog.length >= 2) {
      const startMs = new Date(executionLog[0].timestamp).getTime();
      const endMs   = new Date(executionLog[executionLog.length - 1].timestamp).getTime();
      const delta   = endMs - startMs;
      durationStr   = delta > 0 ? `${(delta / 1000).toFixed(1)}s` : '';
    }

    if (selectedScenarioId === 'risk-flash') {
      showNarration({
        id: key,
        text: `All metrics green. Compiling in ${nodeCount} nodes instead of 8.`,
        accentColor: '#05AB8C',
      });
    } else {
      showNarration({
        id: key,
        text: `Package complete. ${nodeCount} agents${durationStr ? `, ${durationStr} total` : ''}.`,
        accentColor: NODE_ACCENT.report_compiler,
      });
    }
  }, [isComplete, selectedScenarioId, nodes.length, executionLog, showNarration]);

  // Reset prevComplete ref when a new run starts
  useEffect(() => {
    if (!isComplete) prevCompleteRef.current = false;
  }, [isComplete]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="fixed bottom-6 right-6 z-[60] w-72"
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 280, damping: 24 }}
        >
          {/* Progress bar — depletes over DISMISS_AFTER_MS */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] rounded-b-xl"
            style={{ backgroundColor: current.accentColor }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: DISMISS_AFTER_MS / 1000, ease: 'linear' }}
          />

          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(0,46,98,0.96)',
              border: `1px solid ${current.accentColor}44`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${current.accentColor}22`,
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Header */}
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${current.accentColor}22`, border: `1px solid ${current.accentColor}44` }}
              >
                <MessageSquare size={10} style={{ color: current.accentColor }} strokeWidth={2} />
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: current.accentColor, fontFamily: 'var(--font-mono)' }}
              >
                Narration
              </span>
              {/* Dismiss */}
              <button
                type="button"
                onClick={() => setCurrent(null)}
                className="ml-auto text-white/20 hover:text-white/60 transition-colors text-sm leading-none"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ×
              </button>
            </div>

            {/* Animated text */}
            <TextAnimate
              animation="blurInUp"
              by="word"
              startOnView={false}
              className="text-xs leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)' }}
              duration={0.4}
            >
              {current.text}
            </TextAnimate>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
