'use client';

import { useExecutionStore } from '@/store/executionStore';
import { AGENT_DISPLAY_DATA } from '@/data/agentDisplayData';
import {
  RagStrip,
  FinancialMetricCard,
  GaugeBar,
  CreditScoreRing,
  SparklinePanel,
  MetricTable,
} from '@/components/report/viz';
import type { RAGStatus } from '@/types/state';

interface SectionVizBlockProps {
  sectionId: string;
}

export function SectionVizBlock({ sectionId }: SectionVizBlockProps) {
  const liveState = useExecutionStore((s) => s.liveState);

  const fm = liveState.financialMetrics;
  const cm = liveState.capitalMetrics;
  const cr = liveState.creditMetrics;
  const trend = liveState.trendAnalysis;
  const reg = liveState.regulatoryDigest;
  const ops = liveState.operationalRiskDigest;

  const hasLive = fm || cm || cr || trend || reg || ops;

  let content: React.ReactNode = null;

  switch (sectionId) {
    case 'executive_summary': {
      const domains: { label: string; status: RAGStatus | null | undefined }[] = [
        { label: 'Financial', status: fm?.ragStatus },
        { label: 'Capital', status: cm?.ragStatus },
        { label: 'Credit', status: cr?.ragStatus },
        { label: 'Trend', status: trend?.ragStatus },
        { label: 'Regulatory', status: reg?.escalationRequired ? 'red' as RAGStatus : null },
        { label: 'Operational', status: ops?.ragStatus },
      ];
      if (hasLive) {
        content = <RagStrip domains={domains} />;
      } else {
        content = <RagStrip domains={[
          { label: 'Financial', status: 'amber' },
          { label: 'Capital', status: 'green' },
          { label: 'Credit', status: 'red' },
          { label: 'Trend', status: 'amber' },
          { label: 'Regulatory', status: 'red' },
          { label: 'Operational', status: 'amber' },
        ]} />;
      }
      break;
    }

    case 'financial_performance': {
      if (fm) {
        content = (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 20 }}>
            <FinancialMetricCard label="Net Interest Margin" metric={fm.nim} />
            <FinancialMetricCard label="Return on Assets" metric={fm.roa} />
            <FinancialMetricCard label="Return on Equity" metric={fm.roe} />
            <FinancialMetricCard label="Efficiency Ratio" metric={fm.efficiencyRatio} />
          </div>
        );
      } else if (!hasLive) {
        const fb = AGENT_DISPLAY_DATA.financial_aggregator;
        if (fb.tableHeaders && fb.tableRows) {
          content = <MetricTable headers={fb.tableHeaders} rows={fb.tableRows} />;
        }
      }
      break;
    }

    case 'capital_and_liquidity': {
      if (cm) {
        content = (
          <GaugeBar metrics={[
            { label: 'CET1 Ratio', metric: cm.cet1 },
            { label: 'Tier 1 Capital', metric: cm.tierOne },
            { label: 'Total Capital', metric: cm.totalCapital },
            { label: 'LCR (Liquidity)', metric: cm.lcr },
            { label: 'NSFR (Funding)', metric: cm.nsfr },
          ]} />
        );
      } else if (!hasLive) {
        const fb = AGENT_DISPLAY_DATA.capital_monitor;
        if (fb.gauges) content = <GaugeBar gauges={fb.gauges} />;
      }
      break;
    }

    case 'credit_quality': {
      if (cr) {
        content = <CreditScoreRing metrics={cr} />;
      } else if (!hasLive) {
        const fb = AGENT_DISPLAY_DATA.credit_quality;
        if (fb.tableHeaders && fb.tableRows) {
          content = <MetricTable headers={fb.tableHeaders} rows={fb.tableRows} />;
        }
      }
      break;
    }

    case 'trend_analysis': {
      if (trend) {
        content = <SparklinePanel trendAnalysis={trend} />;
      } else if (!hasLive) {
        const fb = AGENT_DISPLAY_DATA.trend_analyzer;
        if (fb.sparkLines) content = <SparklinePanel sparkLines={fb.sparkLines} />;
      }
      break;
    }

    case 'regulatory_status': {
      if (reg && reg.openMRAs.length > 0) {
        content = (
          <MetricTable
            headers={['MRA ID', 'Description', 'Severity', 'Due Date', 'Status']}
            rows={reg.openMRAs.map((m) => ({
              label: m.id,
              values: [m.description, m.severity, m.dueDate, m.status],
              highlight: m.status === 'overdue' ? 'red' as const : m.status === 'in_progress' ? 'amber' as const : undefined,
            }))}
          />
        );
      } else if (!hasLive) {
        const fb = AGENT_DISPLAY_DATA.regulatory_digest;
        if (fb.tableHeaders && fb.tableRows) {
          content = <MetricTable headers={fb.tableHeaders} rows={fb.tableRows} />;
        }
      }
      break;
    }

    case 'operational_risk': {
      if (ops && ops.incidents.length > 0) {
        content = (
          <MetricTable
            headers={['Incident', 'Severity', 'Status']}
            rows={ops.incidents.map((inc) => ({
              label: inc.summary,
              values: [inc.severity, inc.status],
              highlight: inc.severity === 'critical' || inc.severity === 'high' ? 'amber' as const : undefined,
            }))}
          />
        );
      } else if (!hasLive) {
        const fb = AGENT_DISPLAY_DATA.operational_risk;
        if (fb.tableHeaders && fb.tableRows) {
          content = <MetricTable headers={fb.tableHeaders} rows={fb.tableRows} />;
        }
      }
      break;
    }

    default:
      return null;
  }

  if (!content) return null;

  return (
    <div style={{
      marginBottom: 20,
      padding: '16px 20px',
      background: '#FAFAFA',
      borderRadius: 10,
      border: '1px solid #E8E8E8',
    }}>
      {content}
    </div>
  );
}
