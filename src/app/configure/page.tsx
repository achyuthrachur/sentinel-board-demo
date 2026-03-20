'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { ScenarioTile } from '@/components/configure/ScenarioTile';
import { ScenarioPreviewGraph } from '@/components/configure/ScenarioPreviewGraph';
import { AgentDetailDrawer } from '@/components/configure/AgentDetailDrawer';
import { SentinelChat } from '@/components/configure/SentinelChat';
// CustomBuilderCanvas replaced by inline CustomDropZone + ScenarioPreviewGraph
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { SCENARIOS } from '@/data/scenarios';
import { useExecutionStore } from '@/store/executionStore';

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

type ConfigureMode = 'preset' | 'chat' | 'custom';

const SCENARIO_META: Record<string, { title: string; desc: string }> = {
  'falcon-board':    { title: 'Quarterly board package', desc: 'Full 10-agent analysis with human review' },
  'audit-committee': { title: 'Mid-cycle audit brief', desc: 'Focused regulatory and operational review' },
  'risk-flash':      { title: 'Monthly flash report', desc: 'Quick capital and credit snapshot' },
};

interface AnalyzeResponse {
  run_id: string;
  graph_topology: unknown;
  node_count: number;
  meta_rationale: string;
  visual_columns?: string[][];
  edges?: import('@/types/events').EdgeDef[];
}

const MODE_TABS: { id: ConfigureMode; label: string; icon: string }[] = [
  { id: 'preset', label: 'Preset', icon: '\u2606' },
  { id: 'chat', label: 'AI Chat', icon: '\u2726' },
  { id: 'custom', label: 'Custom', icon: '\u2692' },
];

// ─── Draggable palette item ──────────────────────────────────────────────────

function DraggablePaletteItem({ agentId, placed, onClickAdd }: { agentId: string; placed: boolean; onClickAdd: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: agentId });
  const agent = NODE_REGISTRY[agentId];
  if (!agent) return null;
  const color = TYPE_COLOR_MAP[agent.type] ?? agent.color;

  return (
    <div
      ref={setNodeRef}
      style={{
        height: 38,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 12px',
        background: isDragging ? 'rgba(245,168,0,0.1)' : placed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isDragging ? 'rgba(245,168,0,0.3)' : placed ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        opacity: placed ? 0.3 : 1,
        transition: 'opacity 0.2s, background 0.15s',
        width: '100%',
        touchAction: 'none',
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        zIndex: isDragging ? 100 : undefined,
        position: isDragging ? 'relative' as const : undefined,
      }}
    >
      {/* Drag handle */}
      <span {...listeners} {...attributes} style={{ cursor: placed ? 'default' : 'grab', display: 'flex', alignItems: 'center', padding: 2 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      </span>
      {/* Clickable label area */}
      <span
        onClick={placed ? undefined : onClickAdd}
        style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', fontFamily: 'var(--font-body)', flex: 1, cursor: placed ? 'default' : 'pointer' }}
      >
        {agent.label}
      </span>
      {placed && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>added</span>}
      {!placed && <span onClick={placed ? undefined : onClickAdd} style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>+</span>}
    </div>
  );
}

const TYPE_COLOR_MAP: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

// ─── Custom drop zone (wraps ScenarioPreviewGraph with droppable) ────────────

function CustomDropZone({ customAgents, onNodeClick, onReset }: { customAgents: string[]; onNodeClick: (id: string) => void; onReset: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop' });
  const isEmpty = customAgents.length === 0;

  return (
    <div ref={setNodeRef} style={{ flex: 1, position: 'relative', background: isOver ? '#E8E8F0' : '#F0F0F4', transition: 'background 0.2s' }}>
      {isEmpty ? (
        <>
          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #DDDDE2 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          {/* Empty state */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 420, height: 220,
              border: `2px dashed ${isOver ? '#F5A800' : '#CCC'}`, borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10,
              transition: 'border-color 0.2s',
            }}>
              <div style={{ fontSize: 36, color: isOver ? '#F5A800' : '#DDD' }}>+</div>
              <div style={{ fontSize: 15, color: isOver ? '#F5A800' : '#AAA', fontFamily: 'var(--font-body)' }}>
                {isOver ? 'Drop here!' : 'Drag agents here to build your graph'}
              </div>
              <div style={{ fontSize: 11, color: '#CCC', fontFamily: 'var(--font-mono)' }}>Or click agents in the palette</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <ScenarioPreviewGraph
            scenario={buildChatScenario(customAgents)}
            onNodeClick={onNodeClick}
          />
          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            style={{
              position: 'absolute', top: 16, right: 20, zIndex: 20,
              display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 14px',
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid #E0E0E0', borderRadius: 10,
              fontSize: 11, fontFamily: 'var(--font-mono)', color: '#666', cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </>
      )}
    </div>
  );
}

// Build a synthetic scenario from chat-selected agents
function buildChatScenario(agentIds: string[]): import('@/types/scenarios').ScenarioData {
  // Group agents into columns by their natural stage
  const COL_ORDER: Record<string, number> = {
    meta_agent: 0,
    financial_aggregator: 1, capital_monitor: 1, credit_quality: 1,
    trend_analyzer: 2, regulatory_digest: 2, operational_risk: 2,
    supervisor: 3,
    hitl_gate: 4,
    report_compiler: 5,
  };

  const colMap = new Map<number, string[]>();
  for (const id of agentIds) {
    const col = COL_ORDER[id] ?? 3;
    if (!colMap.has(col)) colMap.set(col, []);
    colMap.get(col)!.push(id);
  }

  const sortedCols = [...colMap.entries()].sort((a, b) => a[0] - b[0]);
  const visualColumns = sortedCols.map(([, agents]) => agents);

  return {
    id: 'chat-custom',
    label: 'Custom Configuration',
    meetingType: 'Custom',
    meetingDate: new Date().toISOString().slice(0, 10),
    institutionName: 'Falcon Community Bank',
    expectedNodes: agentIds,
    hitlRequired: agentIds.includes('hitl_gate'),
    visualColumns,
    agentDataSources: SCENARIOS[0].agentDataSources,
  };
}

export default function ConfigurePage() {
  const router = useRouter();
  const setScenario = useExecutionStore((s) => s.setScenario);
  const startRun = useExecutionStore((s) => s.startRun);
  const resetAll = useExecutionStore((s) => s.resetAll);
  const setAppPhase = useExecutionStore((s) => s.setAppPhase);
  const handleSSEEvent = useExecutionStore((s) => s.handleSSEEvent);

  const [mode, setMode] = useState<ConfigureMode>('preset');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[0]?.id ?? 'falcon-board');
  const [openDrawerAgentId, setOpenDrawerAgentId] = useState<string | null>(null);
  const [chatAgents, setChatAgents] = useState<string[]>([]);
  const [showChatGraph, setShowChatGraph] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [customAgents, setCustomAgents] = useState<string[]>([]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over?.id === 'canvas-drop' && typeof active.id === 'string') {
      if (!customAgents.includes(active.id)) {
        setCustomAgents((prev) => [...prev, active.id as string]);
      }
    }
  };
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setAppPhase('configure'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedScenario = SCENARIOS.find((sc) => sc.id === selectedScenarioId) ?? SCENARIOS[0];
  const canExecute =
    mode === 'preset' ||
    (mode === 'chat' && chatAgents.length >= 2) ||
    (mode === 'custom' && customAgents.length >= 2);

  function matchScenario(agentIds: string[]): string {
    if (agentIds.includes('financial_aggregator') || agentIds.includes('hitl_gate')) return 'falcon-board';
    if (agentIds.includes('regulatory_digest') && !agentIds.includes('financial_aggregator')) return 'audit-committee';
    return 'risk-flash';
  }

  const handleAddChatAgent = (id: string) => {
    if (!chatAgents.includes(id)) setChatAgents((prev) => [...prev, id]);
  };

  const handleRemoveChatAgent = (id: string) => {
    setChatAgents((prev) => prev.filter((a) => a !== id));
  };

  const handleExecute = async () => {
    if (!canExecute || isBuilding) return;
    setIsBuilding(true);
    setError(null);

    let scenarioId = selectedScenarioId;
    if (mode === 'chat' && chatAgents.length >= 2) {
      scenarioId = matchScenario(chatAgents);
    }
    if (mode === 'custom' && customAgents.length >= 2) {
      scenarioId = matchScenario(customAgents);
    }

    // Determine custom node list for chat/custom modes
    const customNodeList =
      mode === 'chat' && chatAgents.length >= 2 ? chatAgents
      : mode === 'custom' && customAgents.length >= 2 ? customAgents
      : undefined;

    try {
      resetAll();
      setScenario(scenarioId);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenarioId,
          ...(customNodeList ? { custom_nodes: customNodeList } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as AnalyzeResponse;
      startRun(data.run_id);

      // Hydrate graph immediately from API response so the build page
      // doesn't depend on SSE delivering graph_constructed (which can
      // fail on Vercel when serverless instances don't share memory).
      const topo = data.graph_topology as { nodes?: string[]; edges?: import('@/types/events').EdgeDef[] } | undefined;
      const graphNodes = topo?.nodes ?? data.edges?.map((e) => e.source) ?? [];
      const graphEdges = data.edges ?? topo?.edges ?? [];
      handleSSEEvent({
        type: 'graph_constructed',
        runId: data.run_id,
        nodes: graphNodes,
        edges: graphEdges,
        rationale: data.meta_rationale,
        nodeCount: data.node_count,
        visualColumns: data.visual_columns,
      });

      setAppPhase('build');
      router.push('/build');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start analysis');
      setIsBuilding(false);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <AppHeader />

      <div style={{ position: 'fixed', top: 64, bottom: 0, left: 0, right: 0, display: 'grid', gridTemplateColumns: '300px 1fr' }}>

        {/* ── LEFT PANEL ── */}
        <div
          style={{
            background: 'linear-gradient(180deg, #001530 0%, #011E41 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            padding: '28px 22px 22px',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 28, flexShrink: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Sparkles size={14} color="#F5A800" />
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.2em', color: '#F5A800' }}>SENTINEL</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0, fontFamily: 'var(--font-display)' }}>
              Configure your package
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.5 }}>
              Choose a preset or build your own agent graph.
            </p>
          </motion.div>

          {/* Mode tabs — segmented control */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'flex', gap: 3, marginBottom: 24, flexShrink: 0, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {MODE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setMode(t.id); setOpenDrawerAgentId(null); }}
                style={{
                  flex: 1,
                  height: 36,
                  border: 'none',
                  borderRadius: 12,
                  background: mode === t.id ? '#F5A800' : 'transparent',
                  color: mode === t.id ? '#011E41' : 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </motion.div>

          {/* Scenarios */}
          {mode === 'preset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
              {SCENARIOS.map((scenario, i) => (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <ScenarioTile
                    id={scenario.id}
                    meetingType={scenario.meetingType}
                    title={SCENARIO_META[scenario.id]?.title ?? scenario.label}
                    agentCount={scenario.expectedNodes.length}
                    hitlRequired={scenario.hitlRequired}
                    isSelected={selectedScenarioId === scenario.id}
                    onClick={() => { setSelectedScenarioId(scenario.id); setOpenDrawerAgentId(null); }}
                  />
                </motion.div>
              ))}

              {/* Selected scenario detail */}
              <motion.div
                key={selectedScenarioId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ marginTop: 8, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                  {SCENARIO_META[selectedScenarioId]?.desc ?? ''}
                </div>
              </motion.div>
            </div>
          )}

          {mode === 'chat' && (
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                Added agents ({chatAgents.length})
              </div>
              {chatAgents.length === 0 ? (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                  Describe your meeting in the chat and I&rsquo;ll recommend agents one by one.
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {chatAgents.map((id) => {
                    const agent = NODE_REGISTRY[id];
                    if (!agent) return null;
                    const color = TYPE_COLOR[agent.type] ?? agent.color;
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          height: 28,
                          padding: '0 10px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 100,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        {agent.label}
                        <button
                          type="button"
                          onClick={() => handleRemoveChatAgent(id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2 }}
                        >
                          <X size={10} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              {chatAgents.length > 0 && chatAgents.length < 2 && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                  Add at least 2 agents to enable execution.
                </p>
              )}
              {chatAgents.length >= 2 && (
                <motion.button
                  type="button"
                  onClick={() => setShowChatGraph((v) => !v)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%',
                    height: 36,
                    marginTop: 8,
                    background: showChatGraph ? 'rgba(177,79,197,0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${showChatGraph ? 'rgba(177,79,197,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10,
                    color: showChatGraph ? '#B14FC5' : 'rgba(255,255,255,0.7)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {showChatGraph ? '\u2190 Back to chat' : 'View graph \u2192'}
                </motion.button>
              )}
              {/* Clear chat */}
              <button
                type="button"
                onClick={() => { setChatAgents([]); setShowChatGraph(false); setChatKey((k) => k + 1); }}
                style={{
                  width: '100%',
                  height: 30,
                  marginTop: 6,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Clear chat &amp; reset
              </button>
            </div>
          )}

          {mode === 'custom' && (
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>
                Agent palette
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.values(NODE_REGISTRY).map((agent) => (
                  <DraggablePaletteItem
                    key={agent.id}
                    agentId={agent.id}
                    placed={customAgents.includes(agent.id)}
                    onClickAdd={() => {
                      if (!customAgents.includes(agent.id)) setCustomAgents((prev) => [...prev, agent.id]);
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
                Drag to canvas or click to add
              </p>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(229,55,107,0.1)', border: '1px solid rgba(229,55,107,0.2)', borderRadius: 14, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#FF7096', flexShrink: 0 }}
            >
              {error}
            </motion.div>
          )}

          {/* Execute */}
          <motion.button
            type="button"
            onClick={() => void handleExecute()}
            disabled={!canExecute || isBuilding}
            whileHover={canExecute && !isBuilding ? { scale: 1.02 } : {}}
            whileTap={canExecute && !isBuilding ? { scale: 0.98 } : {}}
            style={{
              width: '100%',
              height: 52,
              background: !canExecute || isBuilding ? 'rgba(245,168,0,0.25)' : 'linear-gradient(135deg, #F5A800, #FFB820)',
              color: '#011E41',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              borderRadius: 14,
              cursor: !canExecute || isBuilding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              flexShrink: 0,
              boxShadow: canExecute && !isBuilding ? '0 4px 20px rgba(245,168,0,0.25)' : 'none',
            }}
          >
            {isBuilding ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(1,30,65,0.2)', borderTop: '2px solid #011E41', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                Assembling graph...
              </>
            ) : (
              <>
                Execute
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </motion.button>

          {!isBuilding && (
            <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
              {mode === 'chat' && chatAgents.length >= 2
                ? `Custom · ${chatAgents.length} agents`
                : mode === 'custom' && customAgents.length >= 2
                  ? `Custom · ${customAgents.length} agents`
                  : selectedScenario
                    ? `${selectedScenario.label} · ${selectedScenario.expectedNodes.length} agents${selectedScenario.hitlRequired ? ' · Human review' : ''}`
                    : ''}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ background: '#F0F0F4', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {mode === 'preset' && selectedScenario && (
            <div style={{ flex: 1, position: 'relative' }}>
              <ScenarioPreviewGraph
                scenario={selectedScenario}
                onNodeClick={(nodeId) => setOpenDrawerAgentId(nodeId)}
              />
            </div>
          )}

          {/* Chat — always mounted in chat mode, just hidden when viewing graph */}
          {mode === 'chat' && (
            <div style={{ flex: 1, display: showChatGraph ? 'none' : 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              <SentinelChat
                key={chatKey}
                currentScenarioId={selectedScenarioId}
                onScenarioRecommended={(id) => setSelectedScenarioId(id)}
                fullscreen
                chatAgents={chatAgents}
                onAddAgent={handleAddChatAgent}
                visible={!showChatGraph}
              />
            </div>
          )}

          {/* Graph built from chat agents */}
          {mode === 'chat' && showChatGraph && (
            <div style={{ flex: 1, position: 'relative' }}>
              <ScenarioPreviewGraph
                scenario={buildChatScenario(chatAgents)}
                onNodeClick={(nodeId) => setOpenDrawerAgentId(nodeId)}
              />
            </div>
          )}

          {mode === 'custom' && (
            <CustomDropZone
              customAgents={customAgents}
              onNodeClick={(nodeId) => setOpenDrawerAgentId(nodeId)}
              onReset={() => setCustomAgents([])}
            />
          )}

          <AgentDetailDrawer
            agentId={openDrawerAgentId}
            onClose={() => setOpenDrawerAgentId(null)}
          />
        </div>
      </div>
    </DndContext>
  );
}
