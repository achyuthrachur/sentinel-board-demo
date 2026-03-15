'use client';

/* Aesthetic direction: Swiss / typographic */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExecutionStore } from '@/store/executionStore';
import { cn } from '@/lib/utils';
import { LiveStateTab } from './LiveStateTab';
import { ReportPreviewTab } from './ReportPreviewTab';
import { DownloadTab } from './DownloadTab';

export function StatePanel() {
  const downloadReady = useExecutionStore(
    (state) => Boolean(state.docxBuffer ?? state.liveState.docxBuffer),
  );
  const isComplete = useExecutionStore((state) => state.isComplete);

  return (
    <Tabs defaultValue="live-state" className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
      <TabsList
        className="grid h-auto w-full grid-cols-3 gap-2 rounded-[1.25rem] border border-white/8 bg-white/[0.03] p-2"
        variant="line"
      >
        <TabsTrigger
          value="live-state"
          className={cn(
            'rounded-xl border border-transparent px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8FE1FF] transition-colors',
            'data-active:border-white/10 data-active:bg-white/[0.06] data-active:text-white data-active:after:hidden',
          )}
        >
          Live State
        </TabsTrigger>
        <TabsTrigger
          value="report"
          className={cn(
            'rounded-xl border border-transparent px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8FE1FF] transition-colors',
            'data-active:border-white/10 data-active:bg-white/[0.06] data-active:text-white data-active:after:hidden',
            !isComplete && 'text-[#8FE1FF]/80',
          )}
        >
          Report
        </TabsTrigger>
        <TabsTrigger
          value="download"
          className={cn(
            'rounded-xl border border-transparent px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] text-[#8FE1FF] transition-colors',
            'data-active:border-white/10 data-active:bg-white/[0.06] data-active:text-white data-active:after:hidden',
            !downloadReady && 'text-[#8FE1FF]/80',
          )}
        >
          Download
        </TabsTrigger>
      </TabsList>

      <TabsContent value="live-state" className="min-h-0 flex-1">
        <LiveStateTab />
      </TabsContent>

      <TabsContent value="report" className="min-h-0 flex-1">
        <ReportPreviewTab />
      </TabsContent>

      <TabsContent value="download" className="min-h-0 flex-1">
        <DownloadTab />
      </TabsContent>
    </Tabs>
  );
}
