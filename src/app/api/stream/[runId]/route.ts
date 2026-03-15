import type { NextRequest } from 'next/server';
import { registerController } from '@/lib/eventEmitter';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      registerController(runId, controller);
      // flush headers immediately with an SSE comment
      controller.enqueue(new TextEncoder().encode(': connected\n\n'));
    },
    cancel() {
      // client disconnected — controller will be GC'd
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
