import type { RAGStatus } from '@/types/state';

// ─── Shared preamble injected into every section call ─────────────────────────

export const REPORT_PREAMBLE = `You are SENTINEL's Report Compiler agent, acting as a senior board reporting officer for a community bank. You are writing ONE section of a comprehensive board package.

## FORMATTING RULES (MANDATORY)

**Data tables** — Use markdown tables for every set of metrics. Format:
| Metric | Actual | Budget/Min | Variance | Status |
|--------|--------|-----------|----------|--------|
| NIM | 3.21% | 3.40% | -19 bps | ⚠ FLAG |

**Inline emphasis** — Use **bold** for key figures, metric names, and status callouts. Use *italic* for commentary.

**Bullet lists** — Use bullets for flags, action items, and key observations:
- **FLAG:** NIM variance -19 bps exceeds threshold
- **ACTION:** Management review recommended

**Subsection headers** — Use ### for subsections within the section.

**Status callout blocks** — Use blockquotes for important callouts:
> **AMBER — 2 flags identified.** Board attention recommended.

**Trend indicators** — Use ↑ ↓ → for up, down, flat.

## CRITICAL RULES
- Reference ONLY the data provided. Do NOT invent metrics, dates, dollar amounts, or management actions.
- When data includes specific numbers, ALWAYS cite them — never say "the ratio declined" without the actual figure.
- Every metric mentioned in prose MUST also appear in a table.
- Write in executive prose: professional, analytical, specific.
- Output ONLY the section body in markdown. No section title header (the system adds it). No preamble or sign-off.
- Minimum: 3 substantial paragraphs with at least one table.`;

// ─── Section definitions ──────────────────────────────────────────────────────

export interface SectionDef {
  id: string;
  title: string;
  prompt: string;
  ragKey: string | null;
}

export const SECTION_DEFS: SectionDef[] = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    ragKey: null,
    prompt: `Write the Executive Summary section.

REQUIRED CONTENT:
- Opening paragraph: Overall risk posture in 2-3 sentences — state the institution's current health clearly.
- **Key Metrics Dashboard** table with 6-8 most important metrics: Metric, Actual Value, Prior Period, RAG Status columns.
- Numbered list of top 3-5 findings requiring board attention, each with a brief explanation.
- Closing paragraph: Supervisor routing decision and HITL outcome if applicable — describe what the supervisor decided and why.

Use the financialMetrics, capitalMetrics, creditMetrics, trendAnalysis, regulatoryDigest, operationalRiskDigest, supervisorDecision, supervisorRationale, hitlDecision, and hitlNote from the context to synthesize the overall picture. Pull the most critical metric from each upstream agent.`,
  },
  {
    id: 'financial_performance',
    title: 'Financial Performance',
    ragKey: 'financialMetrics.ragStatus',
    prompt: `Write the Financial Performance section.

REQUIRED CONTENT:
- **Full Metrics Table**: NIM, ROA, ROE, Non-Interest Income, Efficiency Ratio — each row must have: Actual, Budget, Prior Period, Variance (bps or %), and Status (✓ OK or ⚠ FLAG).
- ### subsection for EACH flagged metric containing:
  - Root cause analysis of the variance
  - Peer comparison where available
  - Quarter-over-quarter trend commentary
- For unflagged metrics, a brief paragraph confirming within-threshold performance.
- **Flags Summary** bullet list: every flag from financialMetrics.flags with the specific number.
- Overall RAG rationale paragraph: why this section is rated the way it is.

Use financialMetrics from the context — it contains nim, roa, roe, nonInterestIncome, efficiencyRatio (each with value, priorPeriod, budget, variance), ragStatus, and flags array.`,
  },
  {
    id: 'capital_and_liquidity',
    title: 'Capital and Liquidity',
    ragKey: 'capitalMetrics.ragStatus',
    prompt: `Write the Capital and Liquidity section.

REQUIRED CONTENT:
- **Capital Ratios Table**: CET1, Tier 1 Capital, Total Capital — each row: Actual, Regulatory Minimum, Well-Capitalised Threshold, Buffer (bps above minimum), Status.
- **Liquidity Ratios Table**: LCR, NSFR — same column structure.
- For EACH ratio, state the exact cushion above minimum in basis points.
- Flag any ratio within 150 bps of regulatory minimum with a ⚠ warning.
- ### Capital Adequacy subsection: commentary on trends and adequacy.
- ### Liquidity Position subsection: commentary on funding stability.
- Overall RAG rationale paragraph.

Use capitalMetrics from the context — it contains cet1, tierOne, totalCapital, lcr, nsfr (each with value, minimum, wellCapitalized), ragStatus, and flags array.`,
  },
  {
    id: 'credit_quality',
    title: 'Credit Quality',
    ragKey: 'creditMetrics.ragStatus',
    prompt: `Write the Credit Quality section.

REQUIRED CONTENT:
- **Credit Scoring Summary Table**: NPL Ratio, Provision Coverage, NCO Ratio, Concentration Risk — each row: Actual, Peer Median, Score (-1/0/+1), Weight.
- **Concentration Breakdown Table**: Segment, Portfolio %, Policy Limit, Breach Status for each concentration.
- **Watchlist Movements Table** if data available: Borrower, Direction (↑↓), Previous Rating, Current Rating, Balance.
- ### Weighted Credit Score subsection: show the explicit calculation of the weighted score.
- ### subsection for each component score explaining what drove the score.
- Overall RAG rationale paragraph with the computed weighted score.

Use creditMetrics from the context — it contains nplRatio, provisionCoverageRatio, ncoRatio (each with value, priorPeriod, peerMedian), concentrations array, watchlistMovements array, ragStatus, and flags.`,
  },
  {
    id: 'trend_analysis',
    title: 'Trend Analysis',
    ragKey: 'trendAnalysis.ragStatus',
    prompt: `Write the Trend Analysis section.

REQUIRED CONTENT:
- **5-Quarter Trend Table** for key metrics across all available quarters. Columns: Metric, then each quarter label. Rows: NIM, ROA, ROE, NPL Ratio, Efficiency Ratio, CET1.
- ### Flagged Trends subsection: For each metric with a concerning trend:
  - Direction (↑/↓/→), magnitude of change, statistical significance if discernible
  - Impact assessment for the next 1-2 quarters
- **Trend Flags** bullet list with ↑/↓ arrows for each flagged metric.
- ### Forward-Looking Commentary: narrative interpretation of what these trends mean for the bank's trajectory over the next 2 quarters.
- Overall RAG rationale paragraph.

Use trendAnalysis from the context — it contains nimTrend, roaTrend, roeTrend, nplTrend, efficiencyTrend, cet1Trend (each an array of numbers), quarters (array of labels), narrative, and ragStatus.`,
  },
  {
    id: 'regulatory_status',
    title: 'Regulatory Status',
    ragKey: null,
    prompt: `Write the Regulatory Status section.

REQUIRED CONTENT:
- **Open MRAs Table**: Description, Severity, Issue Date, Due Date, Status, Days Overdue (if any).
- **Overdue Items** highlighted separately if any exist — with urgency callout.
- **Upcoming Exams Table** if data available: Examiner, Scheduled Date, Scope, Status.
- ### Escalation Status subsection: whether escalation is required and why.
- ### Remediation Progress subsection: narrative on MRA remediation progress and management actions.
- Overall RAG rationale paragraph.

Use regulatoryDigest from the context — it contains openMRAs array (each with id, description, severity, dueDate, status), overdueItems array, upcomingExams array, summary, and escalationRequired boolean. Derive the status: if escalationRequired or overdue items exist → red/amber; otherwise green.`,
  },
  {
    id: 'operational_risk',
    title: 'Operational Risk',
    ragKey: 'operationalRiskDigest.ragStatus',
    prompt: `Write the Operational Risk section.

REQUIRED CONTENT:
- **Incident Summary Table**: Event Summary, Severity, Status, Board-Reportable (Yes/No), Impact.
- ### subsection for each high/critical severity incident: detailed narrative — what happened, who was affected, regulatory notifications made, remediation status.
- **Top Risks** bullet list from the top risks identified.
- **Control Gaps** bullet list if any control gaps were identified.
- ### Thematic Analysis subsection: patterns across incidents, systemic issues if any.
- Overall RAG rationale paragraph.

Use operationalRiskDigest from the context — it contains incidents array (each with summary, severity, status), topRisks array, controlGaps array, narrative, and ragStatus.`,
  },
];

// ─── Helper: derive RAG from state using dot-path ────────────────────────────

export function deriveRagFromState(
  state: Record<string, unknown>,
  ragKey: string | null,
): RAGStatus | undefined {
  if (!ragKey) return undefined;
  const parts = ragKey.split('.');
  let val: unknown = state;
  for (const p of parts) {
    if (val == null || typeof val !== 'object') return undefined;
    val = (val as Record<string, unknown>)[p];
  }
  if (val === 'red' || val === 'amber' || val === 'green') return val;
  return undefined;
}
