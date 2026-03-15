'use client';

/* Aesthetic direction: Swiss / typographic */

import { useState } from 'react';
import { saveAs } from 'file-saver';
import { Copy, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useExecutionStore } from '@/store/executionStore';

function decodeBase64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function buildFilename(
  institutionName: string | undefined,
  meetingType: string | undefined,
): string {
  const institution = (institutionName ?? 'sentinel').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const meeting = (meetingType ?? 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return `${institution}-${meeting}-board-package.docx`;
}

export function DownloadTab() {
  const isRunning = useExecutionStore((state) => state.isRunning);
  const isComplete = useExecutionStore((state) => state.isComplete);
  const liveState = useExecutionStore((state) => state.liveState);
  const reportMarkdown = useExecutionStore(
    (state) => state.reportMarkdown ?? state.liveState.reportMarkdown ?? null,
  );
  const docxBuffer = useExecutionStore(
    (state) => state.docxBuffer ?? state.liveState.docxBuffer ?? null,
  );

  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const downloadReady = Boolean(docxBuffer);
  const markdownReady = Boolean(reportMarkdown);
  const statusLabel = isRunning ? 'Generating...' : isComplete && downloadReady ? 'Ready' : 'Waiting';
  const statusColor = isRunning ? '#54C0E8' : isComplete && downloadReady ? '#05AB8C' : '#8FE1FF';

  function handleDownload() {
    if (!docxBuffer) return;

    const blob = decodeBase64ToBlob(docxBuffer);
    const filename = buildFilename(liveState.institutionName, liveState.meetingType);
    saveAs(blob, filename);
  }

  async function handleCopy() {
    if (!reportMarkdown) return;

    try {
      await navigator.clipboard.writeText(reportMarkdown);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 2000);
    }
  }

  return (
    <div
      className="flex h-full flex-col rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5"
      aria-disabled={!downloadReady}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3
            className="text-lg font-extrabold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Delivery package
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Export the compiled board package as a DOCX or copy the generated markdown for review.
          </p>
        </div>

        <span
          className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{
            borderColor: `${statusColor}40`,
            backgroundColor: `${statusColor}18`,
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        <Button
          type="button"
          onClick={handleDownload}
          disabled={!downloadReady}
          className="h-12 justify-center rounded-2xl border-0 bg-[#F5A800] text-black shadow-[0_16px_32px_-20px_rgba(245,168,0,0.9)] hover:bg-[#FFD231]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <Download />
          Download DOCX
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => void handleCopy()}
          disabled={!markdownReady}
          className="h-12 justify-center rounded-2xl border border-white/10 bg-transparent text-[#8FE1FF] hover:bg-white/[0.04] hover:text-white"
        >
          <Copy />
          {copyState === 'copied'
            ? 'Copied'
            : copyState === 'error'
              ? 'Copy failed'
              : 'Copy Markdown'}
        </Button>
      </div>

      <div className="mt-auto rounded-[1.25rem] border border-white/6 bg-black/10 p-4">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#8FE1FF]">Status</div>
        <div className="mt-2 text-sm leading-6 text-white">
          {isRunning && 'Generating...'}
          {!isRunning && isComplete && downloadReady && 'Ready'}
          {!isRunning && !isComplete && 'Waiting for execution to finish.'}
          {!isRunning && isComplete && !downloadReady && 'Execution completed without a DOCX payload.'}
        </div>
      </div>
    </div>
  );
}
