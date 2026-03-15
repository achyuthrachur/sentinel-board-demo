'use client';

/* Aesthetic direction: Swiss / typographic */

import { AnimatePresence, motion } from 'motion/react';

import { useExecutionStore } from '@/store/executionStore';
import type { ReportSection } from '@/types/state';

function formatMetricValue(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

function renderContent(content: string): React.ReactNode[] {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const isBulletList = lines.every((line) => /^[-*]\s+/.test(line));
    const isOrderedList = lines.every((line) => /^\d+\.\s+/.test(line));

    if (isBulletList) {
      return (
        <ul key={`ul-${index}`} className="space-y-2 pl-5 text-sm leading-6 text-[var(--text-muted)]">
          {lines.map((line) => (
            <li key={line}>{line.replace(/^[-*]\s+/, '')}</li>
          ))}
        </ul>
      );
    }

    if (isOrderedList) {
      return (
        <ol
          key={`ol-${index}`}
          className="list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--text-muted)]"
        >
          {lines.map((line) => (
            <li key={line}>{line.replace(/^\d+\.\s+/, '')}</li>
          ))}
        </ol>
      );
    }

    return (
      <p key={`p-${index}`} className="text-sm leading-6 text-[var(--text-muted)]">
        {lines.join(' ')}
      </p>
    );
  });
}

function ReportSectionCard({
  section,
  index,
}: {
  section: ReportSection;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.32,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5"
    >
      <header className="border-b-2 border-[#F5A800] pb-3">
        <h3
          className="text-lg font-extrabold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {section.title}
        </h3>
      </header>

      <div className="mt-4 space-y-4" style={{ fontFamily: 'var(--font-body)' }}>
        {renderContent(section.content)}

        {section.metrics && Object.keys(section.metrics).length > 0 && (
          <dl className="grid grid-cols-2 gap-3 rounded-[1.25rem] border border-white/6 bg-black/10 p-4">
            {Object.entries(section.metrics).map(([key, value]) => (
              <div key={key}>
                <dt className="text-[10px] uppercase tracking-[0.18em] text-[#8FE1FF]/80">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">{formatMetricValue(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </motion.article>
  );
}

export function ReportPreviewTab() {
  const isComplete = useExecutionStore((state) => state.isComplete);
  const reportDraft = useExecutionStore((state) => state.liveState.reportDraft ?? null);

  if (!isComplete || !reportDraft) {
    return <div className="h-full" />;
  }

  return (
    <div className="h-full overflow-y-auto pr-1">
      <AnimatePresence mode="popLayout">
        <div className="space-y-4">
          {reportDraft.sections.map((section, index) => (
            <ReportSectionCard key={section.id} section={section} index={index} />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
