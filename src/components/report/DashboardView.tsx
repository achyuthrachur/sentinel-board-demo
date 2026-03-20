'use client';

import { motion } from 'motion/react';
import { useExecutionStore } from '@/store/executionStore';
import { useWhatIfMetrics } from '@/hooks/useWhatIfMetrics';
import { AGENT_DISPLAY_DATA } from '@/data/agentDisplayData';
import {
  RagStrip,
  FinancialMetricCard,
  GaugeBar,
  CreditScoreRing,
  SparklinePanel,
  MetricTable,
  DeltaBadge,
} from '@/components/report/viz';
import type { RAGStatus, ReportDraft } from '@/types/state';

const stagger = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

function SectionLabel({ children, delta }: { children: React.ReactNode; delta?: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#666', fontFamily: 'var(--font-mono)', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {children}
      {delta}
    </div>
  );
}

export function DashboardView() {
  const liveState = useExecutionStore((s) => s.liveState);
  const reportDraftStore = useExecutionStore((s) => s.reportDraft);
  const reportDraft: ReportDraft | null = reportDraftStore ?? (liveState.reportDraft as ReportDraft | null) ?? null;

  const { isActive: whatIfActive, adjusted, baseline } = useWhatIfMetrics();

  // Use adjusted metrics when what-if is active, otherwise baseline live state
  const fm = whatIfActive && adjusted ? adjusted.financial : liveState.financialMetrics;
  const cm = whatIfActive && adjusted ? adjusted.capital : liveState.capitalMetrics;
  const cr = whatIfActive && adjusted ? adjusted.credit : liveState.creditMetrics;
  const trend = whatIfActive && adjusted ? adjusted.trend : liveState.trendAnalysis;
  const reg = liveState.regulatoryDigest;
  const ops = liveState.operationalRiskDigest;
  const kpi = liveState.kpiScorecard;

  // Build RAG domains from live state + fallback display data
  const ragDomains: { label: string; status: RAGStatus | null | undefined }[] =
    whatIfActive && adjusted
      ? adjusted.ragDomains
      : [
          { label: 'Financial', status: fm?.ragStatus },
          { label: 'Capital', status: cm?.ragStatus },
          { label: 'Credit', status: cr?.ragStatus },
          { label: 'Trend', status: trend?.ragStatus },
          { label: 'Regulatory', status: reg?.escalationRequired ? 'red' as RAGStatus : null },
          { label: 'Operational', status: ops?.ragStatus },
        ];

  // If no liveState data at all, pull from static display data
  const hasLive = liveState.financialMetrics || liveState.capitalMetrics || liveState.creditMetrics || liveState.trendAnalysis || reg || ops;

  const fallbackFinancial = AGENT_DISPLAY_DATA.financial_aggregator;
  const fallbackCapital = AGENT_DISPLAY_DATA.capital_monitor;
  const fallbackTrend = AGENT_DISPLAY_DATA.trend_analyzer;
  const fallbackRegulatory = AGENT_DISPLAY_DATA.regulatory_digest;
  const fallbackOperational = AGENT_DISPLAY_DATA.operational_risk;

  let idx = 0;

  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      background: '#FFFFFF',
      border: '1px solid #E0E0E0',
      borderRadius: 8,
      padding: '44px 52px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderTop: whatIfActive ? '3px solid #F5A800' : '3px solid #011E41',
    }}>
      {/* Header */}
      <motion.div
        custom={idx++}
        initial="hidden"
        animate="show"
        variants={stagger}
        style={{
          borderBottom: '2px solid #011E41',
          paddingBottom: 20,
          marginBottom: 32,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D7761D', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
          {reportDraft?.metadata?.institutionName ?? 'Meridian Community Bank'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#011E41', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
            Executive Dashboard
          </div>
          {whatIfActive && (
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              padding: '3px 10px',
              borderRadius: 4,
              background: '#F5A800',
              color: '#011E41',
            }}>
              Scenario Analysis
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
          {reportDraft?.metadata?.meetingType ?? 'Board of Directors'} &middot; {reportDraft?.metadata?.meetingDate ?? 'Q4 2024 Package'}
        </div>
      </motion.div>

      {/* RAG overview strip */}
      <motion.div custom={idx++} initial="hidden" animate="show" variants={stagger}>
        <SectionLabel>RAG Overview</SectionLabel>
        {hasLive || (whatIfActive && adjusted) ? (
          <RagStrip domains={ragDomains} />
        ) : (
          <RagStrip domains={[
            { label: 'Financial', status: 'amber' },
            { label: 'Capital', status: 'green' },
            { label: 'Credit', status: 'red' },
            { label: 'Trend', status: 'amber' },
            { label: 'Regulatory', status: 'red' },
            { label: 'Operational', status: 'amber' },
          ]} />
        )}
      </motion.div>

      {/* Financial Performance */}
      {(fm || !hasLive) && (
        <motion.div custom={idx++} initial="hidden" animate="show" variants={stagger}>
          <SectionLabel
            delta={whatIfActive && adjusted && baseline ? (
              <DeltaBadge baseline={baseline.financial.nim.value} adjusted={adjusted.financial.nim.value} unit="%" decimals={2} />
            ) : undefined}
          >
            Financial Performance
          </SectionLabel>
          {fm ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
              <FinancialMetricCard label="Net Interest Margin" metric={fm.nim} />
              <FinancialMetricCard label="Return on Assets" metric={fm.roa} />
              <FinancialMetricCard label="Return on Equity" metric={fm.roe} />
              <FinancialMetricCard label="Efficiency Ratio" metric={fm.efficiencyRatio} />
            </div>
          ) : fallbackFinancial.tableHeaders && fallbackFinancial.tableRows ? (
            <MetricTable headers={fallbackFinancial.tableHeaders} rows={fallbackFinancial.tableRows} />
          ) : null}
        </motion.div>
      )}

      {/* Capital & Liquidity */}
      {(cm || !hasLive) && (
        <motion.div custom={idx++} initial="hidden" animate="show" variants={stagger}>
          <SectionLabel
            delta={whatIfActive && adjusted && baseline ? (
              <DeltaBadge baseline={baseline.capital.cet1.value} adjusted={adjusted.capital.cet1.value} unit="%" decimals={1} />
            ) : undefined}
          >
            Capital & Liquidity
          </SectionLabel>
          {cm ? (
            <GaugeBar metrics={[
              { label: 'CET1 Ratio', metric: cm.cet1 },
              { label: 'Tier 1 Capital', metric: cm.tierOne },
              { label: 'Total Capital', metric: cm.totalCapital },
              { label: 'LCR (Liquidity)', metric: cm.lcr },
              { label: 'NSFR (Funding)', metric: cm.nsfr },
            ]} />
          ) : fallbackCapital.gauges ? (
            <GaugeBar gauges={fallbackCapital.gauges} />
          ) : null}
        </motion.div>
      )}

      {/* Credit Quality */}
      {(cr || !hasLive) && (
        <motion.div custom={idx++} initial="hidden" animate="show" variants={stagger}>
          <SectionLabel
            delta={whatIfActive && adjusted && baseline ? (
              <DeltaBadge baseline={baseline.credit.nplRatio.value} adjusted={adjusted.credit.nplRatio.value} unit="%" decimals={2} higherIsBetter={false} />
            ) : undefined}
          >
            Credit Quality
          </SectionLabel>
          {cr ? (
            <CreditScoreRing metrics={cr} />
          ) : AGENT_DISPLAY_DATA.credit_quality.tableHeaders && AGENT_DISPLAY_DATA.credit_quality.tableRows ? (
            <MetricTable headers={AGENT_DISPLAY_DATA.credit_quality.tableHeaders} rows={AGENT_DISPLAY_DATA.credit_quality.tableRows} />
          ) : null}
        </motion.div>
      )}

      {/* Trend Analysis */}
      {(trend || !hasLive) && (
        <motion.div custom={idx++} initial="hidden" animate="show" variants={stagger}>
          <SectionLabel>Trend Analysis{whatIfActive ? ' (with projection)' : ''}</SectionLabel>
          {trend ? (
            <SparklinePanel trendAnalysis={trend} projectedIndex={whatIfActive ? trend.quarters.length - 1 : undefined} />
          ) : fallbackTrend.sparkLines ? (
            <SparklinePanel sparkLines={fallbackTrend.sparkLines} />
          ) : null}
        </motion.div>
      )}

      {/* Regulatory Status */}
      {(reg || !hasLive) && (
        <motion.div custom={idx++} initial="hidden" animate="show" variants={stagger}>
          <SectionLabel>Regulatory Status</SectionLabel>
          {reg ? (
            <div style={{ marginBottom: 24 }}>
              {reg.openMRAs.length > 0 && (
                <MetricTable
                  headers={['MRA ID', 'Description', 'Severity', 'Due Date', 'Status']}
                  rows={reg.openMRAs.map((m) => ({
                    label: m.id,
                    values: [m.description, m.severity, m.dueDate, m.status],
                    highlight: m.status === 'overdue' ? 'red' as const : m.status === 'in_progress' ? 'amber' as const : undefined,
                  }))}
                />
              )}
              {reg.upcomingExams.length > 0 && (
                <div style={{ padding: '12px 20px', background: '#FFF5D6', border: '1px solid #F5A800', borderRadius: 10, fontSize: 13, lineHeight: 1.7 }}>
                  {reg.upcomingExams.map((e, i) => (
                    <div key={i}><strong>Upcoming:</strong> {e.examiner} — {e.scheduledDate} — {e.scope}</div>
                  ))}
                </div>
              )}
            </div>
          ) : fallbackRegulatory.tableHeaders && fallbackRegulatory.tableRows ? (
            <MetricTable headers={fallbackRegulatory.tableHeaders} rows={fallbackRegulatory.tableRows} />
          ) : null}
        </motion.div>
      )}

      {/* Operational Risk */}
      {(ops || !hasLive) && (
        <motion.div custom={idx++} initial="hidden" animate="show" variants={stagger}>
          <SectionLabel>Operational Risk</SectionLabel>
          {ops ? (
            <div style={{ marginBottom: 24 }}>
              {ops.incidents.length > 0 && (
                <MetricTable
                  headers={['Incident', 'Severity', 'Status']}
                  rows={ops.incidents.map((inc) => ({
                    label: inc.summary,
                    values: [inc.severity, inc.status],
                    highlight: inc.severity === 'critical' || inc.severity === 'high' ? 'amber' as const : undefined,
                  }))}
                />
              )}
              {ops.topRisks.length > 0 && (
                <div style={{ display: 'grid', gap: 4 }}>
                  {ops.topRisks.map((r, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#1A1A1A', padding: '8px 20px', background: '#FAFAFA', borderRadius: 6 }}>
                      &bull; {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : fallbackOperational.tableHeaders && fallbackOperational.tableRows ? (
            <MetricTable headers={fallbackOperational.tableHeaders} rows={fallbackOperational.tableRows} />
          ) : null}
        </motion.div>
      )}

      {/* KPI Scorecard */}
      {kpi && (
        <motion.div custom={idx++} initial="hidden" animate="show" variants={stagger}>
          <SectionLabel>KPI Scorecard</SectionLabel>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '18px 22px', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0E0E0' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)' }}>Overall Score</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#011E41', fontFamily: 'var(--font-display)', marginTop: 4 }}>{kpi.overallScore}</div>
              </div>
            </div>
            {Object.entries(kpi.categoryScores).length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                {Object.entries(kpi.categoryScores).map(([cat, score]) => (
                  <div key={cat} style={{ padding: '12px 16px', background: '#FAFAFA', borderRadius: 8, border: '1px solid #E0E0E0', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#666', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{cat}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#011E41' }}>{score}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
