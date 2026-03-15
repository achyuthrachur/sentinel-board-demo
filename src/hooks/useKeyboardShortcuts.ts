'use client';

import { useEffect } from 'react';
import { useExecutionStore } from '@/store/executionStore';
import { SCENARIOS } from '@/data/scenarios';
import { useGraphExecution } from './useGraphExecution';

/**
 * Global keyboard shortcuts for presentation mode.
 * Safe to call once in page.tsx — skips if focus is inside an input.
 *
 * Space    → run selected scenario
 * R        → reset
 * 1/2/3    → select scenario (falcon-board / audit-committee / risk-flash)
 * S/N/F    → speed (slow / normal / fast)
 * C        → toggle compare mode
 */
export function useKeyboardShortcuts() {
  const selectedScenarioId = useExecutionStore((s) => s.selectedScenarioId);
  const isRunning          = useExecutionStore((s) => s.isRunning);
  const resetAll           = useExecutionStore((s) => s.resetAll);
  const setSpeed           = useExecutionStore((s) => s.setSpeed);
  const toggleCompareMode  = useExecutionStore((s) => s.toggleCompareMode);

  const { startExecution, switchScenario } = useGraphExecution();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in a form element
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (selectedScenarioId && !isRunning) {
            void startExecution(selectedScenarioId);
          }
          break;

        case 'r':
        case 'R':
          e.preventDefault();
          resetAll();
          break;

        case '1':
          if (SCENARIOS[0]) void switchScenario(SCENARIOS[0].id);
          break;
        case '2':
          if (SCENARIOS[1]) void switchScenario(SCENARIOS[1].id);
          break;
        case '3':
          if (SCENARIOS[2]) void switchScenario(SCENARIOS[2].id);
          break;

        case 's':
        case 'S':
          setSpeed('slow');
          break;
        case 'n':
        case 'N':
          setSpeed('normal');
          break;
        case 'f':
        case 'F':
          setSpeed('fast');
          break;

        case 'c':
        case 'C':
          toggleCompareMode();
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    selectedScenarioId,
    isRunning,
    resetAll,
    setSpeed,
    toggleCompareMode,
    startExecution,
    switchScenario,
  ]);
}
