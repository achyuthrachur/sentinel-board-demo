import type { SSEEvent } from '@/types/events';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HITLDecision {
  decision: 'approved' | 'revised';
  note?: string;
}

// ─── Global Singleton Store ───────────────────────────────────────────────────
// In Next.js dev mode (Turbopack), each route handler may get its own module
// instance. Using globalThis ensures all routes share the same state.

interface EmitterStore {
  controllers: Map<string, ReadableStreamDefaultController>;
  pendingBuffers: Map<string, SSEEvent[]>;
  pendingClose: Set<string>;
  hitlResolvers: Map<string, (decision: HITLDecision) => void>;
}

const STORE_KEY = '__sentinel_emitter__';

function getStore(): EmitterStore {
  const g = globalThis as Record<string, unknown>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = {
      controllers: new Map<string, ReadableStreamDefaultController>(),
      pendingBuffers: new Map<string, SSEEvent[]>(),
      pendingClose: new Set<string>(),
      hitlResolvers: new Map<string, (decision: HITLDecision) => void>(),
    };
  }
  return g[STORE_KEY] as EmitterStore;
}

// ─── SSE Controllers ──────────────────────────────────────────────────────────

export function registerController(
  runId: string,
  controller: ReadableStreamDefaultController,
): void {
  const { controllers, pendingBuffers, pendingClose } = getStore();
  controllers.set(runId, controller);

  // Flush any buffered events
  const buffered = pendingBuffers.get(runId);
  if (buffered) {
    for (const event of buffered) {
      const encoded = new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
      controller.enqueue(encoded);
    }
    pendingBuffers.delete(runId);
  }

  // If execution already finished, close after start() returns (next microtask)
  if (pendingClose.has(runId)) {
    pendingClose.delete(runId);
    queueMicrotask(() => {
      try { controller.close(); } catch { /* already closed */ }
      controllers.delete(runId);
    });
  }
}

export function emit(runId: string, event: SSEEvent): void {
  const { controllers, pendingBuffers } = getStore();
  const controller = controllers.get(runId);
  if (!controller) {
    // Buffer until controller registers (up to 128 events)
    const buf = pendingBuffers.get(runId) ?? [];
    if (buf.length < 128) buf.push(event);
    pendingBuffers.set(runId, buf);
    return;
  }
  const encoded = new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
  controller.enqueue(encoded);
}

export function closeStream(runId: string): void {
  const { controllers, pendingBuffers, pendingClose } = getStore();
  const controller = controllers.get(runId);
  if (controller) {
    // Controller is live — close it now
    try { controller.close(); } catch { /* already closed */ }
    controllers.delete(runId);
    pendingBuffers.delete(runId);
  } else {
    // Controller not yet connected — mark for deferred close
    // Keep buffer so registerController can flush before closing
    pendingClose.add(runId);
  }
}

// ─── HITL Resolvers ───────────────────────────────────────────────────────────

export function registerHITLResolver(
  runId: string,
  resolve: (decision: HITLDecision) => void,
): void {
  getStore().hitlResolvers.set(runId, resolve);
}

export function resolveHITL(runId: string, decision: HITLDecision): boolean {
  const { hitlResolvers } = getStore();
  const resolve = hitlResolvers.get(runId);
  if (!resolve) return false;
  hitlResolvers.delete(runId);
  resolve(decision);
  return true;
}
