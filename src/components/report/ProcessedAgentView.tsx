'use client';

import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentDisplayData } from '@/data/agentDisplayData';
import { MetricTable, GaugeBar, SparklinePanel, DecisionGrid } from '@/components/report/viz';

const PAD = '12px 20px';

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

// ─── Main component ──────────────────────────────────────────────────────────

interface ProcessedAgentViewProps {
  agentId: string;
}

export function ProcessedAgentView({ agentId }: ProcessedAgentViewProps) {
  const agent = NODE_REGISTRY[agentId];
  const panel = getAgentDisplayData(agentId);
  if (!agent || !panel) return <p style={{ color: '#666', padding: 40 }}>No data for this agent.</p>;

  const color = TYPE_COLOR[agent.type] ?? agent.color;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 0' }}>
      {/* Agent header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 4, height: 28, borderRadius: 2, background: color }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#011E41', margin: 0, fontFamily: 'var(--font-display)' }}>{agent.label}</h2>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, background: `${color}15`, padding: '3px 10px', borderRadius: 4 }}>{agent.badgeLabel}</span>
        </div>
        <p style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 1.7, margin: 0, paddingLeft: 16 }}>{panel.explanation}</p>
      </div>

      {/* Processed output sections */}
      {panel.tableHeaders && panel.tableRows && <MetricTable headers={panel.tableHeaders} rows={panel.tableRows} />}
      {panel.tableHeaders_2 && panel.tableRows_2 && <MetricTable headers={panel.tableHeaders_2} rows={panel.tableRows_2} />}

      {panel.watchlistLoans && panel.watchlistLoans.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Watchlist movements</div>
          <div style={{ display: 'grid', gap: 2 }}>
            {panel.watchlistLoans.map((loan) => (
              <div key={loan.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: PAD, background: '#FAFAFA', borderRadius: 8, fontSize: 13 }}>
                <span style={{ color: loan.direction === 'down' ? '#E5376B' : '#05AB8C', fontSize: 16, fontWeight: 700 }}>{loan.direction === 'down' ? '\u2193' : '\u2191'}</span>
                <span style={{ fontWeight: 600, color: '#011E41' }}>{loan.borrower}</span>
                <span style={{ color: '#666' }}>{loan.from} &rarr; {loan.to}</span>
                <span style={{ marginLeft: 'auto', color: '#1A1A1A' }}>{loan.balance}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {panel.gauges && <GaugeBar gauges={panel.gauges} />}
      {panel.sparkLines && <SparklinePanel sparkLines={panel.sparkLines} />}
      {panel.decisionRows && <DecisionGrid rows={panel.decisionRows} decision={panel.decision} rationale={panel.decisionRationale} />}

      {panel.escalationFlag && (
        <div style={{ padding: PAD, background: '#FDEEF3', borderLeft: '3px solid #E5376B', borderRadius: 8, marginBottom: 24, fontSize: 14, color: '#992A5C' }}>
          <strong>{'\u26A0'} ESCALATION FLAG SET</strong>
          {panel.escalationReason && <div style={{ marginTop: 6, fontSize: 13, color: '#1A1A1A' }}>{panel.escalationReason}</div>}
        </div>
      )}

      {panel.upcomingExams && panel.upcomingExams.length > 0 && (
        <div style={{ marginBottom: 24, padding: PAD, background: '#FFF5D6', border: '1px solid #F5A800', borderRadius: 10, fontSize: 13, color: '#1A1A1A', lineHeight: 1.7 }}>
          {panel.upcomingExams.map((e, i) => (
            <div key={i}><strong>Upcoming exam:</strong> {e.examiner} &mdash; {e.date} &mdash; {e.scope}</div>
          ))}
        </div>
      )}

      {panel.incidentDetail && (
        <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
          <div style={{ background: '#F4F4F4', padding: PAD, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666' }}>Incident detail</div>
          {Object.entries(panel.incidentDetail).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: PAD, borderBottom: '1px solid #F4F4F4', fontSize: 13 }}>
              <span style={{ color: '#666' }}>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span style={{ color: '#1A1A1A', fontWeight: 600 }}>{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {panel.topologyColumns && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {panel.topologyColumns.map((col, i) => (
            <div key={i} style={{ flex: '1 1 120px', background: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: 10, padding: PAD, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{col.label}</div>
              {col.agents.map((a) => <div key={a} style={{ fontSize: 13, color: '#011E41', fontWeight: 600 }}>{a}</div>)}
            </div>
          ))}
        </div>
      )}

      {panel.hitlOptions && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {panel.hitlOptions.map((opt) => (
            <div key={opt.action} style={{ padding: PAD, borderRadius: 10, border: `2px solid ${opt.color}`, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: opt.color }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{opt.description}</div>
            </div>
          ))}
        </div>
      )}

      {panel.compilationInputs && (
        <div style={{ marginBottom: 24, display: 'grid', gap: 4 }}>
          {panel.compilationInputs.map((inp, i) => (
            <div key={i} style={{ fontSize: 13, color: '#1A1A1A', padding: PAD, background: '#FAFAFA', borderRadius: 6 }}>&bull; {inp}</div>
          ))}
        </div>
      )}

      {panel.scenarioComparisons && (
        <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Scenario', 'Nodes', 'Human review', 'Rationale'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: PAD, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#011E41', color: '#FFF', fontFamily: 'var(--font-mono)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {panel.scenarioComparisons.map((sc, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FFF' : '#FAFAFA' }}>
                  <td style={{ padding: PAD, fontWeight: 600, color: '#011E41', borderBottom: '1px solid #F4F4F4' }}>{sc.scenario}</td>
                  <td style={{ padding: PAD, borderBottom: '1px solid #F4F4F4' }}>{sc.nodeCount}</td>
                  <td style={{ padding: PAD, borderBottom: '1px solid #F4F4F4' }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 700, background: sc.hitl ? '#FDEEF3' : '#E1F5EE', color: sc.hitl ? '#992A5C' : '#0C7876' }}>{sc.hitl ? 'Required' : 'Skipped'}</span>
                  </td>
                  <td style={{ padding: PAD, color: '#1A1A1A', borderBottom: '1px solid #F4F4F4' }}>{sc.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel.outputStructure && (
        <div style={{ marginBottom: 24, display: 'grid', gap: 2 }}>
          {panel.outputStructure.map((s) => (
            <div key={s.section} style={{ display: 'flex', justifyContent: 'space-between', padding: PAD, background: '#FAFAFA', borderRadius: 8, fontSize: 13 }}>
              <span style={{ color: '#011E41' }}>{s.section}</span>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: '#F5A800', fontWeight: 600 }}>{s.status}</span>
                <span style={{ color: '#666' }}>{s.wordCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {panel.note && (
        <div style={{ fontSize: 13, color: '#F5A800', background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.15)', borderRadius: 10, padding: PAD, lineHeight: 1.7 }}>{panel.note}</div>
      )}
    </div>
  );
}
