'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveAs } from 'file-saver';
import { AppHeader } from '@/components/layout/AppHeader';
import { ReportTOC } from '@/components/report/ReportTOC';
import { StreamingSection } from '@/components/report/StreamingSection';
import { ProcessedAgentView } from '@/components/report/ProcessedAgentView';
import { DashboardView } from '@/components/report/DashboardView';
import { useExecutionStore } from '@/store/executionStore';
import { useWhatIfStore } from '@/store/whatIfStore';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import {
  Timeline, TimelineItem, TimelineDot, TimelineLine,
  TimelineHeading, TimelineContent,
} from '@/components/ui/timeline';
import type { ReportDraft, ReportSection } from '@/types/state';

// ─── Node type colors ─────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  deterministic: '#0075C9',
  algorithmic:   '#05AB8C',
  hybrid:        '#54C0E8',
  llm:           '#F5A800',
  orchestrator:  '#B14FC5',
  human:         '#E5376B',
};

// ─── Static fallback sections (shown when LLM compilation unavailable) ────────

const FALLBACK_SECTIONS: ReportSection[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    ragStatus: 'amber',
    isComplete: true,
    content: `Meridian Community Bank closed Q4 2024 with solid core earnings and capital ratios well above regulatory minimums, offset by two areas that require Board attention.

Net interest margin compressed to 3.21%, a decline of 23 basis points from Q3 and 19 basis points below budget. The commercial real estate portfolio's concentration ratio has breached the internal policy limit of 30%, reaching 34% of total loans.

On the regulatory front, one of the two open MRAs from the October OCC examination has passed its remediation deadline. Capital and liquidity positions remain sound and above well-capitalised thresholds across all metrics.`,
  },
  {
    id: 'financial_performance',
    title: 'Financial Performance',
    ragStatus: 'amber',
    isComplete: true,
    content: `Net interest margin declined to 3.21% in Q4 2024, representing a compression of 23 basis points from Q3 2024 and 19 basis points below the annual budget target of 3.40%. This marks the fourth consecutive quarter of NIM contraction, driven by elevated deposit repricing costs and competitive pressure on loan yields.

Return on assets was 0.94%, marginally below the peer median of 1.02%. Return on equity declined to 9.8% from 10.5% in Q3. Efficiency ratio increased to 61.4%, reflecting higher operating costs without commensurate revenue growth.`,
  },
  {
    id: 'capital_and_liquidity',
    title: 'Capital and Liquidity',
    ragStatus: 'green',
    isComplete: true,
    content: `All capital ratios remain above well-capitalised thresholds. CET1 ratio stands at 12.4% against a regulatory minimum of 4.5% and well-capitalised threshold of 6.5%. Tier 1 capital ratio is 13.1%. Total capital ratio is 14.8%.

Liquidity coverage ratio is 128%, above the 100% regulatory minimum. Net stable funding ratio is 112%. The bank's liquidity position is adequate and no near-term funding concerns have been identified.`,
  },
  {
    id: 'credit_quality',
    title: 'Credit Quality',
    ragStatus: 'red',
    isComplete: true,
    content: `Non-performing loan ratio increased to 1.84% in Q4 2024, up from 1.41% in Q3, and now exceeds the peer median of 1.20%. The increase is driven primarily by two large commercial real estate credits placed on non-accrual status during the quarter.

Commercial real estate concentration reached 34% of total loans, breaching the internal policy limit of 30%. Management is reviewing the concentration policy and expects to present a remediation plan at the next Board meeting. Provision coverage ratio is 68%, below the peer median of 82%.`,
  },
  {
    id: 'regulatory_status',
    title: 'Regulatory Status',
    ragStatus: 'red',
    isComplete: true,
    content: `Two Matters Requiring Attention (MRAs) from the October 2024 OCC examination remain open. The first MRA, related to BSA/AML transaction monitoring controls, has passed its December 31, 2024 remediation deadline without resolution. Management has requested a 60-day extension, which is pending OCC approval.

The second MRA, related to interest rate risk model validation, is on track for its March 31, 2025 deadline. No new supervisory actions have been received. The next scheduled examination is Q3 2025.`,
  },
  {
    id: 'operational_risk',
    title: 'Operational Risk',
    ragStatus: 'amber',
    isComplete: true,
    content: `A third-party vendor data breach in November 2024 exposed limited customer data for approximately 1,200 customers. All affected customers have been notified. Regulatory notifications to the OCC and state banking regulator were completed within required timeframes.

Remediation is in progress. Enhanced vendor due diligence procedures are being implemented. No fraudulent activity has been detected. This incident is considered board-reportable under the bank's operational risk framework.`,
  },
  {
    id: 'trend_analysis',
    title: 'Trend Analysis',
    ragStatus: 'amber',
    isComplete: true,
    content: `NIM has declined in each of the last four quarters, from 3.58% in Q4 2023 to 3.21% in Q4 2024. This 37 basis point compression over four quarters suggests structural rather than cyclical pressure. Management should evaluate deposit pricing strategy and loan portfolio mix.

NPL ratio has increased from 0.98% in Q4 2023 to 1.84% in Q4 2024, a deterioration of 86 basis points. The CRE concentration trend warrants close monitoring given the current commercial real estate market environment.`,
  },
];

// ─── Report page ──────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();
  const runId           = useExecutionStore((s) => s.runId);
  const reportMarkdown  = useExecutionStore((s) => s.reportMarkdown);
  const reportSections  = useExecutionStore((s) => s.reportSections);
  const reportDraftStore = useExecutionStore((s) => s.reportDraft);
  const nodeOutputs     = useExecutionStore((s) => s.nodeOutputs.report_compiler) as Record<string, unknown> | undefined;
  const liveState       = useExecutionStore((s) => s.liveState);
  const executionLog    = useExecutionStore((s) => s.executionLog);
  const isComplete      = useExecutionStore((s) => s.isComplete);
  const resetAll        = useExecutionStore((s) => s.resetAll);
  const docxBuffer      = useExecutionStore((s) => s.docxBuffer ?? s.liveState.docxBuffer ?? null);
  const setAppPhase     = useExecutionStore((s) => s.setAppPhase);
  const handleSSEEvent  = useExecutionStore((s) => s.handleSSEEvent);

  const isWhatIfActive = useWhatIfStore((s) => s.isWhatIfActive);

  const [activeSection, setActiveSection] = useState(0);
  const [tocView, setTOCView] = useState<'dashboard' | 'report' | 'agents'>('dashboard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Build agent node list from execution log
  const storeNodes = useExecutionStore((s) => s.nodes);
  const agentNodeIds = storeNodes.length > 0
    ? storeNodes.map((n) => n.id).filter((id) => id in NODE_REGISTRY)
    : Object.keys(NODE_REGISTRY);

  // 2-second grace period after completion before falling back
  const [useFallback, setUseFallback] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  // Use the persisted reportDraft (survives rehydration), fall back to liveState
  const reportDraft = reportDraftStore ?? liveState.reportDraft;

  // Compute fallback tiers BEFORE useEffects that reference them
  const nodeOutputDraft = (nodeOutputs?.reportDraft as ReportDraft | undefined);
  const draftSections = reportDraft?.sections ?? nodeOutputDraft?.sections ?? [];

  useEffect(() => {
    setAppPhase('complete');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isComplete && executionLog.length === 0) {
      router.replace('/configure');
    }
  }, [isComplete, executionLog.length, router]);

  // Fetch report data via REST — bypasses SSE entirely.
  // The node_completed SSE event for report_compiler is too large (docxBuffer
  // is 100-500KB base64) and gets silently dropped by browsers/proxies.
  // This REST call is the reliable path for the report payload.
  // Retries every 2s until the server has the data (execution may still be running).
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!runId || fetchedRef.current) return;
    // Already have sections AND docx — nothing to fetch
    if (reportSections.length > 0 && docxBuffer) return;

    let cancelled = false;

    async function poll() {
      for (let attempt = 0; attempt < 30 && !cancelled; attempt++) {
        try {
          const res = await fetch(`/api/report/${runId}`);
          if (res.ok) {
            const data = await res.json() as {
              reportDraft: ReportDraft;
              reportMarkdown: string | null;
              docxBuffer: string | null;
            };
            if (data?.reportDraft) {
              fetchedRef.current = true;
              useExecutionStore.setState((prev) => ({
                reportDraft: data.reportDraft ?? prev.reportDraft,
                reportMarkdown: data.reportMarkdown ?? prev.reportMarkdown,
                docxBuffer: data.docxBuffer ?? prev.docxBuffer,
                reportSections: data.reportDraft?.sections?.length
                  ? data.reportDraft.sections.map((s: ReportSection) => ({
                      ...s,
                      isStreaming: false,
                      isComplete: true,
                    }))
                  : prev.reportSections,
              }));
              return;
            }
          }
        } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    void poll();
    return () => { cancelled = true; };
  }, [runId, reportSections.length, docxBuffer]);

  // Fall back to FALLBACK_SECTIONS only if NO source has sections after 2s
  useEffect(() => {
    if (isComplete && reportSections.length === 0 && draftSections.length === 0) {
      const timer = setTimeout(() => setUseFallback(true), 2000);
      return () => clearTimeout(timer);
    }
    if (reportSections.length > 0 || draftSections.length > 0) setUseFallback(false);
  }, [isComplete, reportSections.length, draftSections.length]);

  // Auto-scroll to new sections as they stream in
  const prevSectionCount = useRef(0);
  useEffect(() => {
    if (reportSections.length > prevSectionCount.current) {
      prevSectionCount.current = reportSections.length;
      const latestId = reportSections[reportSections.length - 1]?.id;
      if (latestId && sectionRefs.current[latestId] && scrollRef.current) {
        const el = sectionRefs.current[latestId];
        const container = scrollRef.current;
        container.scrollTo({ top: el!.offsetTop - 24, behavior: 'smooth' });
      }
      setActiveSection(reportSections.length - 1);
    }
  }, [reportSections.length]);

  // Determine which sections to display — multiple fallback tiers:
  // 1. reportSections (live-streamed via SSE, best case)
  // 2. reportDraft.sections (persisted, from node_completed)
  // 3. nodeOutputs.report_compiler.reportDraft.sections (persisted, last resort before static)
  // 4. FALLBACK_SECTIONS (hardcoded static content)
  const sections: ReportSection[] = reportSections.length > 0
    ? reportSections
    : draftSections.length > 0
    ? draftSections.map((s) => ({ ...s, isStreaming: false, isComplete: true }))
    : useFallback
    ? FALLBACK_SECTIONS
    : [];

  const scrollToSection = (index: number) => {
    setActiveSection(index);
    const id = sections[index]?.id;
    if (id && sectionRefs.current[id] && scrollRef.current) {
      const el = sectionRefs.current[id];
      const container = scrollRef.current;
      container.scrollTo({ top: el!.offsetTop - 24, behavior: 'smooth' });
    }
  };

  const handleDownload = () => {
    if (!docxBuffer) return;
    const bytes = Uint8Array.from(atob(docxBuffer), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const institution = (reportDraft?.metadata?.institutionName ?? 'board')
      .replace(/\s+/g, '-').toLowerCase();
    saveAs(blob, `sentinel-${institution}.docx`);
  };

  const handleCopy = () => {
    if (reportMarkdown) navigator.clipboard.writeText(reportMarkdown);
  };

  const isStreaming = reportSections.some((s) => s.isStreaming);

  return (
    <>
      <AppHeader
        rightContent={
          <>
            {isStreaming && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: '#F5A800',
                  letterSpacing: '0.08em',
                  animation: 'pulse 1.2s ease-in-out infinite',
                }}
              >
                STREAMING REPORT…
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              style={{
                height: 34, padding: '0 14px', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4,
                color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-mono)',
                fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer',
                opacity: reportMarkdown ? 1 : 0.4,
              }}
            >
              Copy markdown
            </button>
            <button
              type="button"
              onClick={() => { resetAll(); router.push('/configure'); }}
              style={{
                height: 34, padding: '0 14px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4,
                color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)',
                fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer',
              }}
            >
              New package
            </button>
          </>
        }
      />

      <div
        style={{
          position: 'fixed',
          top: 64,
          bottom: 0,
          left: 0,
          right: 0,
          display: 'grid',
          gridTemplateColumns: '240px 1fr 280px',
        }}
      >
        {/* LEFT: TOC */}
        <ReportTOC
          sections={sections}
          activeIndex={activeSection}
          onSelect={(i) => { setTOCView('report'); setSelectedAgentId(null); scrollToSection(i); }}
          onDownload={handleDownload}
          canDownload={!!docxBuffer}
          executionLog={executionLog}
          tocView={tocView}
          onTOCViewChange={(v) => { setTOCView(v); if (v !== 'agents') setSelectedAgentId(null); }}
          selectedAgentId={selectedAgentId}
          onSelectAgent={(id) => { setSelectedAgentId(id); setTOCView('agents'); }}
          agentNodeIds={agentNodeIds}
        />

        {/* CENTER: Report or Agent View */}
        <div
          ref={scrollRef}
          style={{ background: '#F4F4F4', overflowY: 'auto', padding: '32px 40px 60px' }}
        >
          {/* ── Dashboard view ── */}
          {tocView === 'dashboard' && !selectedAgentId && (
            <DashboardView />
          )}

          {/* ── Agent processed output view ── */}
          {selectedAgentId && (
            <div style={{ maxWidth: 800, margin: '0 auto', background: '#FFFFFF', border: '1px solid #E0E0E0', borderRadius: 8, padding: '32px 40px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <ProcessedAgentView agentId={selectedAgentId} />
            </div>
          )}

          {/* ── What-If indicator when on Report tab ── */}
          {tocView === 'report' && !selectedAgentId && isWhatIfActive && (
            <div style={{
              maxWidth: 700,
              margin: '0 auto 12px',
              padding: '8px 16px',
              background: '#FFF8E6',
              border: '1px solid #F5A800',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: '#8B6914',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F5A800', flexShrink: 0 }} />
              What-If analysis active on Dashboard — report content is unaffected
            </div>
          )}

          {/* ── Report view ── */}
          {tocView === 'report' && !selectedAgentId && (
          <div
            style={{
              maxWidth: 700,
              margin: '0 auto',
              background: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: 8,
              padding: '44px 52px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderTop: '3px solid #011E41',
            }}
          >
            {/* Report header */}
            <div
              style={{
                borderBottom: '2px solid #011E41',
                paddingBottom: 20,
                marginBottom: 36,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'end',
                gap: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#D7761D',
                    marginBottom: 6,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {reportDraft?.metadata?.institutionName ?? 'Meridian Community Bank'}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#011E41',
                    lineHeight: 1.15,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {reportDraft?.metadata?.meetingType ?? 'Board of Directors'}<br />
                  {reportDraft?.metadata?.meetingDate ?? 'Q4 2024 Package'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#333333', marginBottom: 3 }}>
                  {reportDraft?.metadata?.generatedAt
                    ? new Date(reportDraft.metadata.generatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'January 2025'}
                </div>
                <div style={{ fontSize: 11, color: '#333333', fontFamily: 'var(--font-mono)' }}>
                  Prepared by Sentinel · Crowe AI
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    background: '#E0E0E0',
                    padding: '2px 8px',
                    borderRadius: 3,
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#333333',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginTop: 6,
                  }}
                >
                  Confidential
                </div>
              </div>
            </div>

            {/* Loading state before streaming starts */}
            {sections.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: '#666666',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 8,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                >
                  Assembling board package…
                </div>
                <div style={{ fontSize: 11, color: '#E0E0E0', fontFamily: 'var(--font-mono)' }}>
                  Sections will appear as the report compiler streams them
                </div>
              </div>
            )}

            {/* Streaming sections */}
            {sections.map((section, i) => (
              <StreamingSection
                key={section.id}
                section={section}
                index={i}
                isActive={i === activeSection}
                sectionRef={(el) => { sectionRefs.current[section.id] = el; }}
              />
            ))}
          </div>
          )}
        </div>

        {/* RIGHT: Agent execution trace (dark) */}
        <div
          style={{
            background: '#001833',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono)',
                marginBottom: 2,
              }}
            >
              Agent execution trace
            </div>
            <div style={{ fontSize: 12, color: '#FFFFFF' }}>
              How this package was assembled
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {executionLog.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                No execution log available.<br />Run a scenario to see agent traces here.
              </div>
            ) : (
              <div style={{ padding: '8px 14px' }}>
                <Timeline positions="left">
                  {executionLog.map((entry, i) => {
                    const dotColor = NODE_COLORS[entry.nodeType] ?? '#444';
                    const isHuman = entry.nodeType === 'human';
                    const isStreamingCompiler = isStreaming && entry.nodeId === 'report_compiler';
                    return (
                      <TimelineItem key={i} status="done">
                        <TimelineDot
                          status="custom"
                          customIcon={
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: isStreamingCompiler ? '#F5A800' : dotColor,
                                boxShadow: isStreamingCompiler ? '0 0 8px rgba(245,168,0,0.6)' : 'none',
                              }}
                            />
                          }
                          className="border-transparent bg-transparent shadow-none"
                          style={isStreamingCompiler ? { boxShadow: '0 0 8px rgba(245,168,0,0.4)', borderColor: 'rgba(245,168,0,0.4)' } : undefined}
                        />
                        {i < executionLog.length - 1 && (
                          <TimelineLine done className="min-h-0 h-4" />
                        )}
                        <TimelineHeading
                          className="text-[12px] font-bold leading-tight"
                          style={{ color: isHuman ? '#E5376B' : 'rgba(255,255,255,0.75)' }}
                        >
                          {entry.label}
                        </TimelineHeading>
                        <TimelineContent
                          className="text-[10px] pb-2 leading-relaxed"
                          style={{
                            color: isHuman ? 'rgba(229,55,107,0.7)' : '#FFFFFF',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {entry.nodeType}
                          {entry.durationMs !== undefined ? ` · ${entry.durationMs}ms` : ''}
                          {entry.summary && (
                            <div
                              style={{
                                fontSize: 11,
                                color: isHuman ? 'rgba(229,55,107,0.8)' : '#FFFFFF',
                                lineHeight: 1.45,
                                marginTop: 2,
                                fontFamily: 'var(--font-body)',
                              }}
                            >
                              {entry.summary}
                            </div>
                          )}
                        </TimelineContent>
                      </TimelineItem>
                    );
                  })}
                </Timeline>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
