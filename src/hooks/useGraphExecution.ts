'use client';

import { useCallback } from 'react';
import { useExecutionStore } from '@/store/executionStore';
import { SCENARIOS } from '@/data/scenarios';
import { useSSE } from './useSSE';

interface AnalyzeResponse {
  run_id: string;
  graph_topology: unknown;
  node_count: number;
  meta_rationale: string;
}

export function useGraphExecution() {
  const runId = useExecutionStore((s) => s.runId);
  const isRunning = useExecutionStore((s) => s.isRunning);
  const isComplete = useExecutionStore((s) => s.isComplete);
  const isPaused = useExecutionStore((s) => s.isPaused);
  const startRun = useExecutionStore((s) => s.startRun);
  const resetAll = useExecutionStore((s) => s.resetAll);
  const setScenario = useExecutionStore((s) => s.setScenario);
  const selectedScenarioId = useExecutionStore((s) => s.selectedScenarioId);
  const nodes = useExecutionStore((s) => s.nodes);
  const setSwitchAnnotation = useExecutionStore((s) => s.setSwitchAnnotation);

  // Hook up SSE stream whenever we have a runId
  useSSE(runId);

  const startExecution = useCallback(
    async (scenarioId: string) => {
      if (isRunning) return;

      resetAll();
      setScenario(scenarioId);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as AnalyzeResponse;

      startRun(data.run_id);
    },
    [isRunning, resetAll, setScenario, startRun],
  );

  /**
   * switchScenario — handles animated graph rebuild when changing scenarios.
   * - If nothing is running: simple select with no animation.
   * - If a run is active or complete: fade graph out, show switch annotation,
   *   wait 400 ms, then fire a fresh execution of the new scenario.
   */
  const switchScenario = useCallback(
    async (newId: string) => {
      if (newId === selectedScenarioId && !isRunning && !isComplete) return;

      // Simple selection when idle
      if (!isRunning && !isComplete) {
        setScenario(newId);
        return;
      }

      const fromScenario = SCENARIOS.find((s) => s.id === selectedScenarioId);
      const toScenario = SCENARIOS.find((s) => s.id === newId);

      // Show switch annotation (persists across resetAll since it's outside initialState)
      setSwitchAnnotation({
        fromLabel: fromScenario?.label ?? selectedScenarioId ?? '—',
        fromCount: nodes.length,
        toLabel: toScenario?.label ?? newId,
      });

      // Clearing nodes triggers AnimatePresence exit on the graph
      resetAll();

      // Wait for exit animation
      await new Promise<void>((r) => setTimeout(r, 400));

      // Clear annotation then start fresh
      setSwitchAnnotation(null);
      await startExecution(newId);
    },
    [
      selectedScenarioId,
      isRunning,
      isComplete,
      nodes.length,
      setSwitchAnnotation,
      resetAll,
      setScenario,
      startExecution,
    ],
  );

  return { startExecution, switchScenario, isRunning, isPaused };
}
