import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getReportResult } from '@/lib/eventEmitter';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  const result = getReportResult(runId);

  if (!result) {
    return NextResponse.json(
      { error: 'Report not found — execution may still be in progress' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    reportDraft: result.reportDraft,
    reportMarkdown: result.reportMarkdown,
    docxBuffer: result.docxBuffer,
  });
}
