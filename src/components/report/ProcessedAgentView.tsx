'use client';

import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getAgentDisplayData, type AgentPanel, type TableRow, type MetricGauge, type SparkLine, type DecisionRow } from '@/data/agentDisplayData';

const PAD = '12px 20px';

const TYPE_COLOR: Record<string, string> = {
  deterministic: '#0075C9', algorithmic: '#05AB8C', hybrid: '#54C0E8',
  llm: '#F5A800', orchestrator: '#B14FC5', human: '#E5376B',
};

// ─── Sub-renderers (light mode) ──────────────────────────────────────────────

function PTable({ headers, rows }: { headers: string[]; rows: TableRow[] }) {
  const HL_BG: Record<string, string> = { red: '#FDEEF3', amber: '#FFF5D6', green: '#E1F5EE' };
  const HL_C: Record<string, string> = { red: '#992A5C', amber: '#D7761D', green: '#0C7876' };

  return (
    <div style={{ marginBottom: 24, borderRadius: 10, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: i === 0 ? 'left' : 'right', padding: PAD, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#011E41', color: '#FFFFFF', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const bg = row.highlight && row.highlight !== 'none' ? HL_BG[row.highlight] ?? '#FFF' : i % 2 === 0 ? '#FFF' : '#FAFAFA';
            const color = row.highlight && row.highlight !== 'none' ? HL_C[row.highlight] ?? '#1A1A1A' : '#1A1A1A';
            return (
              <tr key={i} style={{ background: bg }}>
                <td style={{ padding: PAD, fontWeight: row.bold ? 700 : 600, color, borderBottom: '1px solid #F4F4F4' }}>{row.label}</td>
                {row.values.map((v, j) => (
                  <td key={j} style={{ padding: PAD, textAlign: 'right', fontWeight: row.bold ? 700 : 400, color, borderBottom: '1px solid #F4F4F4' }}>{v}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PGauges({ gauges }: { gauges: MetricGauge[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
      {gauges.map((g) => {
        const fill = g.status === 'green' ? '#05AB8C' : g.status === 'amber' ? '#F5A800' : '#E5376B';
        return (
          <div key={g.label} style={{ padding: '18px 22px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#011E41' }}>{g.label}</span>
              <span style={{ fontSize: 18, color: fill, fontWeight: 700 }}>{g.actualLabel}</span>
            </div>
            <div style={{ height: 6, background: '#E0E0E0', borderRadius: 3, position: 'relative' }}>
              <div style={{ height: '100%', width: `${Math.min(g.fillPct, 100)}%`, background: fill, borderRadius: 3, transition: 'width 0.8s ease' }} />
              <div style={{ position: 'absolute', left: `${(g.minimum / (g.actual * 1.3)) * 100}%`, top: -3, bottom: -3, width: 2, background: '#E5376B', borderRadius: 1 }} />
              {g.wellCapitalized !== undefined && (
                <div style={{ position: 'absolute', left: `${(g.wellCapitalized / (g.actual * 1.3)) * 100}%`, top: -3, bottom: -3, width: 2, background: '#05AB8C', borderRadius: 1 }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#666', marginTop: 8 }}>
              <span>min {g.minimumLabel}</span>
              {g.wellCapLabel && <span>well-cap {g.wellCapLabel}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PSparklines({ sparkLines }: { sparkLines: SparkLine[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
      {sparkLines.map((sl) => {
        const h = 80, padX = 24, padY = 16;
        const vals = sl.points.map((p) => p.value);
        const min = Math.min(...vals) * 0.95, max = Math.max(...vals) * 1.05;
        const range = max - min || 1;
        return (
          <div key={sl.label} style={{ padding: '18px 22px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#011E41' }}>{sl.label}</span>
              <span style={{ fontSize: 12, color: sl.color, fontWeight: 600 }}>{sl.trendLabel}</span>
            </div>
            <svg width="100%" viewBox={`0 0 400 ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
              <path d={sl.points.map((p, i) => { const x = padX + (i / (sl.points.length - 1)) * (400 - 2 * padX); const y = padY + (1 - (p.value - min) / range) * (h - 2 * padY); return `${i === 0 ? 'M' : 'L'} ${x} ${y}`; }).join(' ') + ` L ${400 - padX} ${h} L ${padX} ${h} Z`} fill={`${sl.color}12`} />
              <path d={sl.points.map((p, i) => { const x = padX + (i / (sl.points.length - 1)) * (400 - 2 * padX); const y = padY + (1 - (p.value - min) / range) * (h - 2 * padY); return `${i === 0 ? 'M' : 'L'} ${x} ${y}`; }).join(' ')} fill="none" stroke={sl.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {sl.points.map((p, i) => { const x = padX + (i / (sl.points.length - 1)) * (400 - 2 * padX); const y = padY + (1 - (p.value - min) / range) * (h - 2 * padY); return (<g key={i}><circle cx={x} cy={y} r={4} fill="#FFF" stroke={sl.color} strokeWidth={2} /><text x={x} y={y - 10} textAnchor="middle" fill="#1A1A1A" fontSize={10}>{p.value}{sl.unit}</text></g>); })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginTop: 8, padding: '0 8px' }}>
              {sl.points.map((p) => <span key={p.quarter}>{p.quarter}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PDecisions({ rows, decision, rationale }: { rows: DecisionRow[]; decision?: string; rationale?: string }) {
  const FS: Record<string, { bg: string; color: string; icon: string }> = {
    critical: { bg: '#FDEEF3', color: '#992A5C', icon: '\u26A0\u26A0' },
    warning: { bg: '#FFF5D6', color: '#D7761D', icon: '\u26A0' },
    ok: { bg: '#E1F5EE', color: '#0C7876', icon: '\u2713' },
  };
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'grid', gap: 2 }}>
        {rows.map((r, i) => {
          const f = r.flag ? FS[r.flag] : null;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: PAD, background: f ? f.bg : '#FAFAFA', borderRadius: 8 }}>
              <span style={{ fontSize: 14, color: '#1A1A1A' }}>{r.input}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: f?.color ?? '#1A1A1A' }}>{r.value}</span>
                {f && <span style={{ fontSize: 11, background: f.bg, color: f.color, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>{f.icon}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {decision && (
        <div style={{ marginTop: 16, padding: '18px 22px', background: 'rgba(245,168,0,0.06)', border: '1px solid rgba(245,168,0,0.2)', borderRadius: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#011E41', marginBottom: 6 }}>{decision}</div>
          {rationale && <div style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 1.7 }}>{rationale}</div>}
        </div>
      )}
    </div>
  );
}

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
      {panel.tableHeaders && panel.tableRows && <PTable headers={panel.tableHeaders} rows={panel.tableRows} />}
      {panel.tableHeaders_2 && panel.tableRows_2 && <PTable headers={panel.tableHeaders_2} rows={panel.tableRows_2} />}

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

      {panel.gauges && <PGauges gauges={panel.gauges} />}
      {panel.sparkLines && <PSparklines sparkLines={panel.sparkLines} />}
      {panel.decisionRows && <PDecisions rows={panel.decisionRows} decision={panel.decision} rationale={panel.decisionRationale} />}

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
