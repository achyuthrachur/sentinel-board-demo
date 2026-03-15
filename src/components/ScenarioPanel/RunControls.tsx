'use client';

import { useEffect } from 'react';
import { animate } from 'animejs';

import { useGraphExecution } from '@/hooks/useGraphExecution';
import { useExecutionStore } from '@/store/executionStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RunControlsProps {
  selectedScenarioId: string | null;
}

const SPEEDS = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
] as const;

export function RunControls({ selectedScenarioId }: RunControlsProps) {
  const speed = useExecutionStore((state) => state.speed);
  const setSpeed = useExecutionStore((state) => state.setSpeed);
  const resetAll = useExecutionStore((state) => state.resetAll);
  const { startExecution, isRunning } = useGraphExecution();

  useEffect(() => {
    if (isRunning || !selectedScenarioId) {
      return;
    }

    const animation = animate('.run-button', {
      boxShadow: [
        '0 0 0 0 rgba(245,168,0,0)',
        '0 0 0 12px rgba(245,168,0,0.3)',
        '0 0 0 0 rgba(245,168,0,0)',
      ],
      duration: 2000,
      loop: true,
      ease: 'outQuad',
    });

    return () => {
      animation.revert();
    };
  }, [isRunning, selectedScenarioId]);

  function handleRun() {
    if (!selectedScenarioId || isRunning) {
      return;
    }

    void startExecution(selectedScenarioId);
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/8 bg-[rgba(255,255,255,0.025)] p-4">
      <Button
        type="button"
        onClick={handleRun}
        disabled={!selectedScenarioId || isRunning}
        className={cn(
          'run-button h-12 w-full rounded-2xl border-0 bg-[#F5A800] text-black shadow-[0_14px_32px_-18px_rgba(245,168,0,0.95)] hover:bg-[#FFD231]',
          isRunning && 'opacity-50',
        )}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Run Analysis
      </Button>

      <div className="grid grid-cols-3 gap-2">
        {SPEEDS.map(({ value, label }) => {
          const isActive = speed === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setSpeed(value)}
              className={cn(
                'rounded-full border px-3 py-2 text-xs font-medium tracking-[0.22em] uppercase transition-colors',
                isActive
                  ? 'border-[#F5A800] bg-[#F5A800] text-black'
                  : 'border-white/10 bg-transparent text-[#8FE1FF] hover:border-[#54C0E8]/40 hover:bg-white/5',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={resetAll}
        className="h-8 self-start px-0 text-[#8FE1FF] hover:bg-transparent hover:text-white"
      >
        Reset
      </Button>
    </div>
  );
}
