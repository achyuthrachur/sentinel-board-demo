'use client';

import { Hash, TrendingUp, GitMerge, Sparkles, Brain, UserCheck } from 'lucide-react';

const LEGEND_ITEMS = [
  { color: '#0075C9', Icon: Hash,        label: 'Rules Engine',  type: 'DETERMINISTIC' },
  { color: '#05AB8C', Icon: TrendingUp,  label: 'ML Scoring',    type: 'ALGORITHMIC'   },
  { color: '#54C0E8', Icon: GitMerge,    label: 'Hybrid',        type: 'HYBRID'        },
  { color: '#F5A800', Icon: Sparkles,    label: 'AI Agent',      type: 'LLM'           },
  { color: '#B14FC5', Icon: Brain,       label: 'Orchestrator',  type: 'ORCHESTRATOR'  },
  { color: '#E5376B', Icon: UserCheck,   label: 'Human Review',  type: 'HITL'          },
] as const;

export function GraphLegend() {
  return (
    <div
      className="absolute bottom-4 left-4 z-10 rounded-xl p-3"
      style={{
        backgroundColor: 'rgba(0,46,98,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <p
        className="mb-2 text-[9px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
      >
        Node Types
      </p>
      <div className="flex flex-col gap-1.5">
        {LEGEND_ITEMS.map(({ color, Icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
              style={{ backgroundColor: `${color}18`, border: `1px solid ${color}44` }}
            >
              <Icon size={8} style={{ color }} strokeWidth={2.5} />
            </div>
            <span
              className="text-[9px] leading-none text-white"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
