'use client';

import type { ScenarioData } from '@/types/scenarios';
import { Badge } from '@/components/ui/badge';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { cn } from '@/lib/utils';

interface ScenarioCardProps {
  scenario: ScenarioData;
  isSelected: boolean;
  onSelect: () => void;
}

export function ScenarioCard({
  scenario,
  isSelected,
  onSelect,
}: ScenarioCardProps) {
  const hasHitl = scenario.expectedNodes.includes('hitl_gate');

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left outline-none"
      aria-pressed={isSelected}
    >
      <SpotlightCard
        spotlightColor="rgba(84, 192, 232, 0.14)"
        className={cn(
          'transition-colors duration-200',
          isSelected
            ? 'border-l-4 border-[#F5A800]'
            : 'border-l-4 border-transparent hover:border-[#F5A800]/50',
        )}
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8FE1FF]">
            {scenario.meetingType}
          </div>

          <div
            className="text-[1.15rem] font-extrabold leading-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {scenario.label}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-white/10 bg-white/4 text-[#8FE1FF]"
            >
              {scenario.expectedNodes.length} agents
            </Badge>
            {hasHitl && (
              <Badge
                className="border border-[#E5376B]/25 bg-[#E5376B]/12 text-[#FF6E90]"
              >
                HITL
              </Badge>
            )}
          </div>
        </div>
      </SpotlightCard>
    </button>
  );
}
