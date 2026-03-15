'use client';

import { GraphCanvas } from '@/components/GraphCanvas/GraphCanvas';
import { ExecutionLog } from '@/components/ExecutionLog/ExecutionLog';
import { HITLModal } from '@/components/HITLModal/HITLModal';
import { ScenarioPanel } from '@/components/ScenarioPanel/ScenarioPanel';
import { StatePanel } from '@/components/StatePanel/StatePanel';
import { CompareView } from '@/components/CompareView/CompareView';
import { NarrationOverlay } from '@/components/NarrationOverlay/NarrationOverlay';
import { KeyboardLegend } from '@/components/KeyboardLegend/KeyboardLegend';
import { useExecutionStore } from '@/store/executionStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { motion, AnimatePresence } from 'motion/react';
import { Columns2, LayoutPanelLeft } from 'lucide-react';

export default function Home() {
  const compareMode       = useExecutionStore((s) => s.compareMode);
  const toggleCompareMode = useExecutionStore((s) => s.toggleCompareMode);

  // Activate global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-text-primary">
      {/* Global overlays */}
      <HITLModal />
      <NarrationOverlay />

      <header
        className="flex h-14 shrink-0 items-center border-b px-6"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <span
          className="text-lg font-bold tracking-wide"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
        >
          CROWE SENTINEL
        </span>
        <span className="ml-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          AI Board Intelligence Engine
        </span>

        {/* Header controls — pushed to the right */}
        <div className="ml-auto flex items-center gap-3">
          {/* Keyboard legend */}
          <KeyboardLegend />

          {/* Compare mode toggle */}
          <button
            type="button"
            onClick={toggleCompareMode}
            className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all"
            style={{
              fontFamily: 'var(--font-display)',
              borderColor: compareMode ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
              backgroundColor: compareMode ? 'rgba(245,168,0,0.12)' : 'transparent',
              color: compareMode ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {compareMode
              ? <LayoutPanelLeft size={13} />
              : <Columns2 size={13} />}
            {compareMode ? 'Single View' : 'Compare Scenarios'}
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {compareMode ? (
          <motion.div
            key="compare"
            className="flex flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CompareView />
          </motion.div>
        ) : (
          <motion.div
            key="single"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-1 overflow-hidden">
              <aside
                className="flex w-[360px] shrink-0 flex-col overflow-y-auto border-r p-4"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Scenarios
                </p>
                <ScenarioPanel />
              </aside>

              <main
                className="relative flex flex-1 flex-col overflow-hidden"
                style={{ backgroundColor: 'var(--background)' }}
              >
                <div className="absolute inset-0">
                  <GraphCanvas />
                </div>
              </main>

              <aside
                className="flex w-[400px] shrink-0 flex-col overflow-y-auto border-l p-4"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
              >
                <p
                  className="text-xs font-medium uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Live State
                </p>
                <StatePanel />
              </aside>
            </div>

            <footer
              className="flex h-[120px] shrink-0 flex-col overflow-hidden border-t px-4 py-3"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
            >
              <p
                className="mb-2 text-xs font-medium uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}
              >
                Execution Log
              </p>
              <div className="flex min-h-0 flex-1 items-stretch">
                <ExecutionLog />
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
