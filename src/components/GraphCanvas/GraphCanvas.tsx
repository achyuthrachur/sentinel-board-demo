'use client';

import '@xyflow/react/dist/style.css';

import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import { AnimatePresence, motion } from 'motion/react';
import { Brain } from 'lucide-react';

import { useExecutionStore } from '@/store/executionStore';
import { DeterministicNode } from './nodes/DeterministicNode';
import { AlgorithmicNode } from './nodes/AlgorithmicNode';
import { LLMNode } from './nodes/LLMNode';
import { HybridNode } from './nodes/HybridNode';
import { OrchestratorNode } from './nodes/OrchestratorNode';
import { HITLNode } from './nodes/HITLNode';
import { AnimatedEdge } from './AnimatedEdge';
import { GraphLegend } from './GraphLegend';
import { MetaAgentReveal } from './MetaAgentReveal';
import { SwitchAnnotation } from './SwitchAnnotation';
import { GraphDiffPanel } from './GraphDiffPanel';

// ─── Node + Edge Type Registries ─────────────────────────────────────────────

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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCanvas() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: '#B14FC510',
          border: '1px solid rgba(177,79,197,0.15)',
        }}
        animate={{
          boxShadow: [
            '0 0 0px 0px #B14FC500',
            '0 0 18px 4px #B14FC525',
            '0 0 0px 0px #B14FC500',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Brain size={22} style={{ color: 'rgba(177,79,197,0.5)' }} strokeWidth={1.5} />
      </motion.div>
      <div className="text-center">
        <p
          className="text-sm font-bold text-white opacity-40"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Select a scenario to begin
        </p>
        <p
          className="mt-1 text-xs opacity-25"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          Meta-agent will construct the graph
        </p>
      </div>
    </div>
  );
}

// ─── Graph canvas ─────────────────────────────────────────────────────────────

export function GraphCanvas() {
  const nodes = useExecutionStore((s) => s.nodes);
  const edges = useExecutionStore((s) => s.edges);
  const onNodesChange = useExecutionStore((s) => s.onNodesChange);
  const onEdgesChange = useExecutionStore((s) => s.onEdgesChange);
  const showReveal = useExecutionStore((s) => s.showReveal);
  const revealRationale = useExecutionStore((s) => s.revealRationale);
  const revealNodeCount = useExecutionStore((s) => s.revealNodeCount);
  const dismissReveal = useExecutionStore((s) => s.dismissReveal);
  const switchAnnotation = useExecutionStore((s) => s.switchAnnotation);

  const hasGraph = nodes.length > 0;

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {!hasGraph && !showReveal && !switchAnnotation && (
          <motion.div
            key="empty"
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyCanvas />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasGraph && (
          <motion.div
            key="flow"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4 }}
          >
            {/* Pad bottom to leave room for GraphDiffPanel */}
            <div className="absolute inset-0 bottom-0" style={{ paddingBottom: 0 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.22 }}
                minZoom={0.3}
                maxZoom={2}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag
                zoomOnScroll
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1}
                  color="rgba(255,255,255,0.07)"
                />
              </ReactFlow>
            </div>

            {/* Legend — overlays the canvas, bottom-left */}
            <GraphLegend />

            {/* Graph diff panel — collapsible, bottom */}
            <GraphDiffPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Switch annotation overlay — shown during graph transition */}
      <SwitchAnnotation annotation={switchAnnotation} />

      {/* MetaAgentReveal overlay */}
      <MetaAgentReveal
        visible={showReveal}
        rationale={revealRationale}
        nodeCount={revealNodeCount}
        onDismiss={dismissReveal}
      />
    </div>
  );
}
