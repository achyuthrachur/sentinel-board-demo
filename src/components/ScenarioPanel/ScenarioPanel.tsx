'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SCENARIOS } from '@/data/scenarios';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { useExecutionStore } from '@/store/executionStore';
import { useGraphExecution } from '@/hooks/useGraphExecution';
import { ScenarioCard } from './ScenarioCard';
import { RunControls } from './RunControls';
import { AgentSelector } from './AgentSelector';

const DEFAULT_CUSTOM_NODES = Object.keys(NODE_REGISTRY);

export function ScenarioPanel() {
  const selectedScenarioId = useExecutionStore((state) => state.selectedScenarioId);
  const { switchScenario } = useGraphExecution();
  const [customNodes, setCustomNodes] = useState<string[]>(DEFAULT_CUSTOM_NODES);
  const [customOpen, setCustomOpen] = useState(false);

  const baseScenarioId = selectedScenarioId ?? SCENARIOS[0]?.id ?? 'falcon-board';

  return (
    <div className="mt-4 flex h-full flex-col gap-3">
      {/* Preset scenario cards */}
      <div className="flex flex-col gap-2">
        {SCENARIOS.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={!customOpen && selectedScenarioId === scenario.id}
            onSelect={() => {
              setCustomOpen(false);
              void switchScenario(scenario.id);
            }}
          />
        ))}
      </div>

      {/* Custom Build — collapsible */}
      <div
        className="rounded-2xl border"
        style={{ borderColor: customOpen ? 'rgba(245,168,0,0.3)' : 'var(--border)' }}
      >
        <button
          type="button"
          onClick={() => setCustomOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
        >
          <span
            className="text-[11px] font-bold uppercase tracking-widest"
            style={{
              fontFamily: 'var(--font-display)',
              color: customOpen ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            Custom Build
          </span>
          {customOpen
            ? <ChevronUp size={13} style={{ color: 'var(--accent)' }} />
            : <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />}
        </button>

        {customOpen && (
          <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'rgba(245,168,0,0.15)' }}>
            <p
              className="mb-3 text-[10px]"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Data source: {SCENARIOS.find((s) => s.id === baseScenarioId)?.label ?? baseScenarioId}
            </p>
            <AgentSelector selectedNodes={customNodes} onChange={setCustomNodes} />
          </div>
        )}
      </div>

      <div className="mt-auto">
        <RunControls
          selectedScenarioId={customOpen ? baseScenarioId : selectedScenarioId}
          customNodes={customOpen ? customNodes : undefined}
        />
      </div>
    </div>
  );
}
