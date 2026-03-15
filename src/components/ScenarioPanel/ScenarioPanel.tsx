'use client';

/* Aesthetic direction: Luxury / refined */

import { SCENARIOS } from '@/data/scenarios';
import { useExecutionStore } from '@/store/executionStore';
import { useGraphExecution } from '@/hooks/useGraphExecution';
import { ScenarioCard } from './ScenarioCard';
import { RunControls } from './RunControls';

export function ScenarioPanel() {
  const selectedScenarioId = useExecutionStore((state) => state.selectedScenarioId);
  const { switchScenario } = useGraphExecution();

  return (
    <div className="mt-4 flex h-full flex-col gap-4">
      <div className="flex flex-col gap-3">
        {SCENARIOS.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={selectedScenarioId === scenario.id}
            onSelect={() => { void switchScenario(scenario.id); }}
          />
        ))}
      </div>

      <div className="mt-auto">
        <RunControls selectedScenarioId={selectedScenarioId} />
      </div>
    </div>
  );
}
