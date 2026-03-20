'use client';

import { useEffect, useRef } from 'react';
import { useExecutionStore, SPEED_DELAY } from '@/store/executionStore';
import type { SSEEvent } from '@/types/events';

const MAX_RETRIES = 3;

export function useSSE(runId: string | null) {
  const handleSSEEvent = useExecutionStore((s) => s.handleSSEEvent);
  const speed = useExecutionStore((s) => s.speed);

  // Keep a ref so the effect closure always sees the latest speed without re-subscribing
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Queue events and process with speed-based pacing
  const queueRef = useRef<SSEEvent[]>([]);
  const processingRef = useRef(false);

  // Report streaming events bypass the speed queue entirely — they represent
  // real-time content that should not be artificially delayed.
  const IMMEDIATE_TYPES = new Set([
    'report_section_started',
    'report_token',
    'report_section_complete',
  ]);

  function enqueue(event: SSEEvent) {
    if (IMMEDIATE_TYPES.has(event.type)) {
      // Process immediately, skip queue
      handleSSEEvent(event);
      return;
    }
    queueRef.current.push(event);
    if (!processingRef.current) processNext();
  }

  function processNext() {
    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }
    processingRef.current = true;
    const event = queueRef.current.shift()!;
    handleSSEEvent(event);
    // Progress events: shorter delay (feels like incremental work)
    // Node transitions (started/completed): full delay (visual pause between nodes)
    const isProgress = event.type === 'node_progress';
    const delay = isProgress
      ? Math.round(SPEED_DELAY[speedRef.current] * 0.4)
      : SPEED_DELAY[speedRef.current];
    setTimeout(processNext, delay);
  }

  useEffect(() => {
    if (!runId) return;

    let retryCount = 0;
    let es: EventSource | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;

      es = new EventSource(`/api/stream/${runId}`);

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data as string) as SSEEvent;
          enqueue(event);
        } catch {
          // ignore malformed events
        }
      };

      es.onerror = () => {
        es?.close();
        if (cancelled) return;
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          const backoff = 1000 * retryCount;
          setTimeout(connect, backoff);
        }
      };
    }

    // Clear queue from any prior run
    queueRef.current = [];
    processingRef.current = false;

    connect();

    return () => {
      cancelled = true;
      es?.close();
      queueRef.current = [];
      processingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);
}
