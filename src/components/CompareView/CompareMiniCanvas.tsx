'use client';

import '@xyflow/react/dist/style.css';

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Loader2 } from 'lucide-react';

import type { IsolatedState } from '@/hooks/useIsolatedExecution';
import { DeterministicNode } from '@/components/GraphCanvas/nodes/DeterministicNode';
import { AlgorithmicNode } from '@/components/GraphCanvas/nodes/AlgorithmicNode';
import { LLMNode } from '@/components/GraphCanvas/nodes/LLMNode';
import { HybridNode } from '@/components/GraphCanvas/nodes/HybridNode';
import { OrchestratorNode } from '@/components/GraphCanvas/nodes/OrchestratorNode';
import { HITLNode } from '@/components/GraphCanvas/nodes/HITLNode';
import { AnimatedEdge } from '@/components/GraphCanvas/AnimatedEdge';
import { MetaAgentReveal } from '@/components/GraphCanvas/MetaAgentReveal';

const nodeTypes: NodeTypes = {
  deterministicNode: DeterministicNode,
  algorithmicNode:   AlgorithmicNode,
  llmNode:           LLMNode,
  hybridNode:        HybridNode,
  orchestratorNode:  OrchestratorNode,
  hitlNode:          HITLNode,
};

const edgeTypes: EdgeTypes = {
  animatedEdge: AnimatedEdge,
};

interface CompareMiniCanvasProps {
  execution: IsolatedState & {
    startExecution: (id: string) => Promise<void>;
    dismissReveal: () => void;
  };
  label: string;
  nodeCountHint: number;
  accent?: string;
}

export function CompareMiniCanvas({
  execution,
  label,
  nodeCountHint,
  accent = 'var(--accent)',
}: CompareMiniCanvasProps) {
  const hasGraph = execution.nodes.length > 0;

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{ borderRight: '1px solid var(--border)' }}
    >
      {/* Header label */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-2"
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'rgba(0,46,98,0.7)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
          >
            {label}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          {execution.isRunning && !execution.isComplete && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
            >
              <Loader2 size={12} style={{ color: accent }} />
            </motion.div>
          )}
          {execution.isComplete && (
            <CheckCircle2 size={12} style={{ color: '#05AB8C' }} />
          )}
          <span
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{
              color: execution.isComplete ? '#05AB8C' : accent,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {execution.isComplete
              ? `${execution.nodes.length} nodes complete`
              : execution.isRunning
                ? `${execution.activeNodeId ?? 'running'}…`
                : `${nodeCountHint} nodes expected`}
          </span>
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1 overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
        {/* Empty state */}
        <AnimatePresence>
          {!hasGraph && !execution.showReveal && (
            <motion.div
              key="empty"
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: accent }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span
                  className="text-xs opacity-30"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  Awaiting meta-agent…
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ReactFlow */}
        <AnimatePresence>
          {hasGraph && (
            <motion.div
              key="flow"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ReactFlow
                nodes={execution.nodes}
                edges={execution.edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                minZoom={0.25}
                maxZoom={2}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag
                zoomOnScroll
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1}
                  color="rgba(255,255,255,0.05)"
                />
              </ReactFlow>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MetaAgentReveal */}
        <MetaAgentReveal
          visible={execution.showReveal}
          rationale={execution.revealRationale}
          nodeCount={execution.revealNodeCount}
          onDismiss={execution.dismissReveal}
        />
      </div>
    </div>
  );
}
