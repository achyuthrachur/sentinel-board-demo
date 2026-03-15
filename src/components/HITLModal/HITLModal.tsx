'use client';

/* Aesthetic direction: Luxury / refined */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useExecutionStore } from '@/store/executionStore';
import type { RAGStatus } from '@/types/state';

const RAG_META: Record<RAGStatus, { label: string; color: string }> = {
  green: { label: 'Stable', color: '#05AB8C' },
  amber: { label: 'Watch', color: '#F5A800' },
  red: { label: 'Elevated', color: '#E5376B' },
};

const CARD_TRANSITION = {
  duration: 0.42,
  ease: [0.16, 1, 0.3, 1] as const,
};

function RagCell({
  label,
  status,
}: {
  label: string;
  status: RAGStatus;
}) {
  const meta = RAG_META[status];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="size-2.5 rounded-full shadow-[0_0_18px_currentColor]"
          style={{ color: meta.color, backgroundColor: meta.color }}
        />
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[#8FE1FF]">
          {label}
        </span>
      </div>
      <p
        className="text-lg font-extrabold uppercase tracking-[0.16em]"
        style={{ color: meta.color, fontFamily: 'var(--font-display)' }}
      >
        {meta.label}
      </p>
    </div>
  );
}

function StatChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
      <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[#8FE1FF]">{label}</div>
      <div
        className="mt-1 text-xl font-extrabold text-white"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
    </div>
  );
}

function buildEscalationNote(note: string): string {
  const trimmed = note.trim();
  return trimmed || 'Escalate to board for discussion.';
}

export function HITLModal() {
  const isPaused = useExecutionStore((state) => state.isPaused);
  const runId = useExecutionStore((state) => state.runId);
  const hitlSummary = useExecutionStore((state) => state.hitlSummary);
  const submitHITLDecision = useExecutionStore((state) => state.submitHITLDecision);

  const [note, setNote] = useState('');
  const [pendingDecision, setPendingDecision] = useState<'approved' | 'revised' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOpen = isPaused && hitlSummary !== null;

  useEffect(() => {
    if (!isOpen) {
      setNote('');
      setPendingDecision(null);
      setError(null);
    }
  }, [isOpen]);

  async function handleDecision(decision: 'approved' | 'revised') {
    if (!runId || !hitlSummary) {
      setError('No active review package is available.');
      return;
    }

    setPendingDecision(decision);
    setError(null);

    try {
      await submitHITLDecision(
        runId,
        decision,
        decision === 'revised' ? buildEscalationNote(note) : note.trim() || undefined,
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to submit the CFO review decision.',
      );
      setPendingDecision(null);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && hitlSummary ? (
        <motion.div
          key="hitl-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hitl-modal-title"
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-surface p-8 text-white shadow-[0_42px_120px_-48px_rgba(0,0,0,0.95)]"
            initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(8px)' }}
            transition={CARD_TRANSITION}
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-[#F5A800]/12 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#E5376B]/10 blur-3xl" />
            </div>

            <div className="relative space-y-6">
              <div className="space-y-2">
                <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-[#8FE1FF]">
                  Human in the loop
                </p>
                <h2
                  id="hitl-modal-title"
                  className="text-3xl font-extrabold uppercase tracking-[0.1em]"
                  style={{ color: '#E5376B', fontFamily: 'var(--font-display)' }}
                >
                  CFO REVIEW REQUIRED
                </h2>
                <p className="max-w-xl text-sm leading-6 text-[#8FE1FF]">
                  Execution paused board package ready for review
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <RagCell label="Financial" status={hitlSummary.financialRag} />
                <RagCell label="Capital" status={hitlSummary.capitalRag} />
                <RagCell label="Credit" status={hitlSummary.creditRag} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-[#F5A800]" />
                  <p
                    className="text-sm font-extrabold uppercase tracking-[0.18em] text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Key flags
                  </p>
                </div>
                <ul className="space-y-2">
                  {hitlSummary.keyFlags.map((flag) => (
                    <li key={flag} className="flex items-start gap-3 text-sm leading-6 text-white/90">
                      <span className="mt-2 size-2 rounded-full bg-[#F5A800]" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3">
                <StatChip label="Open MRA count" value={hitlSummary.openMRAs} />
                <StatChip label="Overdue count" value={hitlSummary.overdueRemediations} />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="hitl-note"
                  className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#8FE1FF]"
                >
                  Review note
                </label>
                <Textarea
                  id="hitl-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a note for the record..."
                  disabled={pendingDecision !== null}
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-[#E5376B]/35 bg-[#E5376B]/10 px-4 py-3 text-sm text-white">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => handleDecision('approved')}
                  disabled={pendingDecision !== null}
                  className="h-12 flex-1 rounded-xl border border-[#F5A800] bg-[#F5A800] px-5 text-[0.8rem] font-extrabold uppercase tracking-[0.16em] text-[#011E41] shadow-[0_24px_60px_-36px_rgba(245,168,0,0.95)] hover:bg-[#FFD231]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {pendingDecision === 'approved' ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Submitting
                    </>
                  ) : (
                    'Approve  Compile Final Package'
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDecision('revised')}
                  disabled={pendingDecision !== null}
                  className="h-12 flex-1 rounded-xl border-[#E5376B] bg-transparent px-5 text-[0.8rem] font-extrabold uppercase tracking-[0.16em] text-[#E5376B] hover:bg-[#E5376B]/10 hover:text-[#FF7B9E]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {pendingDecision === 'revised' ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Submitting
                    </>
                  ) : (
                    'Escalate to Board'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
