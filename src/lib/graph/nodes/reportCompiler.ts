import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { generateBoardPackageDOCX } from '@/lib/docx/generateBoardPackage';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import { REPORT_COMPILER_PROMPT } from '@/lib/prompts/reportCompiler';
import { getOpenAIClient, getModel } from '@/lib/openaiClient';
import type { ReportDraft, ReportSection } from '@/types/state';
import type { RAGStatus } from '@/types/state';
import type { SSEEvent } from '@/types/events';

const nodeMeta = NODE_REGISTRY.report_compiler;

function getRunId(state: BoardState, config: RunnableConfig): string {
  const configurable = config.configurable as { runId?: string } | undefined;
  const withRunId = config as RunnableConfig & { runId?: string };
  return configurable?.runId ?? withRunId.runId ?? state.scenarioId;
}

function sectionsToMarkdown(draft: ReportDraft): string {
  const { institutionName, meetingType, meetingDate } = draft.metadata;
  const lines: string[] = [
    `# ${institutionName} - ${meetingType} Board Package`,
    `**Date:** ${meetingDate}`,
    '',
    '---',
    '',
  ];

  for (const section of draft.sections) {
    lines.push(`## ${section.title}`);
    if (section.ragStatus) {
      lines.push(`**Status:** ${section.ragStatus.toUpperCase()}`);
      lines.push('');
    }
    lines.push(section.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Section delimiter parser ─────────────────────────────────────────────────
// Delimiter format: ===SECTION:id:Title:ragStatus=== (ragStatus optional)
// End marker: ===REPORT_END===

const SECTION_RE = /===SECTION:([^:=\n]+):([^:=\n]+)(?::([a-z]+))?===/g;
const END_RE = /===REPORT_END===/;
const RAG_VALUES = new Set(['red', 'amber', 'green']);
const HOLD_BACK = 60; // chars to hold back to avoid splitting a delimiter

function parseRAG(raw: string | undefined): RAGStatus | undefined {
  return RAG_VALUES.has(raw ?? '') ? (raw as RAGStatus) : undefined;
}

export async function reportCompiler(
  state: BoardState,
  config: RunnableConfig,
): Promise<Partial<BoardState>> {
  const runId = getRunId(state, config);
  const startedAt = Date.now();

  emit(runId, {
    type: 'node_started',
    runId,
    nodeId: nodeMeta.id,
    nodeType: nodeMeta.type,
    label: nodeMeta.label,
    inputSnapshot: { sectionCount: 7, model: getModel() },
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  try {
    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: 'Aggregating all agent outputs into report context…', timestamp: new Date().toISOString() } as SSEEvent);
    const context = {
      scenarioId: state.scenarioId,
      institutionName: state.institutionName,
      meetingDate: state.meetingDate,
      meetingType: state.meetingType,
      financialMetrics: state.financialMetrics,
      capitalMetrics: state.capitalMetrics,
      creditMetrics: state.creditMetrics,
      trendAnalysis: state.trendAnalysis,
      regulatoryDigest: state.regulatoryDigest,
      operationalRiskDigest: state.operationalRiskDigest,
      supervisorDecision: state.supervisorDecision,
      supervisorRationale: state.supervisorRationale,
      hitlDecision: state.hitlDecision,
      hitlNote: state.hitlNote,
    };

    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `Calling language model (${getModel()}) — streaming report sections…`, timestamp: new Date().toISOString() } as SSEEvent);

    const stream = await getOpenAIClient().chat.completions.create({
      model: getModel(),
      stream: true,
      temperature: 0.4,
      messages: [
        { role: 'system', content: REPORT_COMPILER_PROMPT },
        { role: 'user', content: JSON.stringify(context) },
      ],
    });

    // ── Streaming parse state ────────────────────────────────────────────────
    let rawBuffer = '';
    let processedUpTo = 0;
    let currentSectionId: string | null = null;

    // Track metadata + content per section for final reportDraft assembly
    const sectionMeta = new Map<string, { title: string; ragStatus?: RAGStatus }>();
    const sectionContent = new Map<string, string>();

    function appendContent(sectionId: string, text: string): void {
      sectionContent.set(sectionId, (sectionContent.get(sectionId) ?? '') + text);
    }

    function flushBuffer(force = false): void {
      const processableEnd = force ? rawBuffer.length : rawBuffer.length - HOLD_BACK;
      if (processableEnd <= processedUpTo) return;

      const chunk = rawBuffer.slice(processedUpTo, processableEnd);
      SECTION_RE.lastIndex = 0;

      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = SECTION_RE.exec(chunk)) !== null) {
        // Content before this match belongs to current section
        const before = chunk.slice(cursor, match.index).replace(END_RE, '');
        if (currentSectionId && before) {
          emit(runId, { type: 'report_token', runId, sectionId: currentSectionId, token: before, timestamp: new Date().toISOString() } as SSEEvent);
          appendContent(currentSectionId, before);
        }

        // Close previous section
        if (currentSectionId) {
          emit(runId, { type: 'report_section_complete', runId, sectionId: currentSectionId, timestamp: new Date().toISOString() } as SSEEvent);
          currentSectionId = null;
        }

        // Start new section
        const sectionId = match[1].trim();
        const title = match[2].trim();
        const ragStatus = parseRAG(match[3]?.trim());
        currentSectionId = sectionId;
        sectionMeta.set(sectionId, { title, ragStatus });
        sectionContent.set(sectionId, '');
        emit(runId, { type: 'report_section_started', runId, sectionId, sectionTitle: title, ragStatus, timestamp: new Date().toISOString() } as SSEEvent);

        cursor = match.index + match[0].length;
      }

      // Remaining content after last marker
      const trailing = chunk.slice(cursor).replace(END_RE, '');
      if (currentSectionId && trailing) {
        emit(runId, { type: 'report_token', runId, sectionId: currentSectionId, token: trailing, timestamp: new Date().toISOString() } as SSEEvent);
        appendContent(currentSectionId, trailing);
      }

      processedUpTo = processableEnd;
    }

    // ── Consume stream ───────────────────────────────────────────────────────
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (delta) {
        rawBuffer += delta;
        flushBuffer(false);
      }
    }

    // Final flush — process everything remaining
    flushBuffer(true);

    // Close final open section
    if (currentSectionId) {
      emit(runId, { type: 'report_section_complete', runId, sectionId: currentSectionId, timestamp: new Date().toISOString() } as SSEEvent);
    }

    // Assemble final sections from tracked metadata + content
    const finalSections: ReportSection[] = Array.from(sectionMeta.entries()).map(([id, meta]) => ({
      id,
      title: meta.title,
      content: (sectionContent.get(id) ?? '').trim(),
      ragStatus: meta.ragStatus,
      isStreaming: false,
      isComplete: true,
    }));

    emit(runId, { type: 'node_progress', runId, nodeId: nodeMeta.id, nodeType: nodeMeta.type, step: `${finalSections.length} section(s) streamed — generating DOCX…`, timestamp: new Date().toISOString() } as SSEEvent);

    const reportDraft: ReportDraft = {
      sections: finalSections,
      metadata: {
        scenarioId: state.scenarioId,
        institutionName: state.institutionName,
        meetingDate: state.meetingDate,
        meetingType: state.meetingType,
        generatedAt: new Date().toISOString(),
        version: 1,
      },
    };

    const reportMarkdown = sectionsToMarkdown(reportDraft);
    const docxBuffer = await generateBoardPackageDOCX(reportDraft, reportDraft.metadata);
    const docxBytes = Buffer.byteLength(docxBuffer, 'base64');

    const stateDelta: Partial<BoardState> = {
      reportDraft,
      reportMarkdown,
      docxBuffer,
    };

    const durationMs = Date.now() - startedAt;

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: `Report compiled. ${finalSections.length} sections. DOCX ${(docxBytes / 1024).toFixed(1)} KB.`,
      stateDelta,
      durationMs,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    emit(runId, {
      type: 'execution_complete',
      runId,
      durationMs,
      reportMarkdown,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    return stateDelta;
  } catch (err) {
    emit(runId, {
      type: 'error',
      runId,
      nodeId: nodeMeta.id,
      message: `reportCompiler error: ${String(err)}`,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    const durationMs = Date.now() - startedAt;

    const fallbackMarkdown = [
      `# ${state.institutionName} - ${state.meetingType} Board Package`,
      `**Date:** ${state.meetingDate}`,
      '',
      '---',
      '',
      '## Report Compilation Error',
      '',
      'The report compiler encountered an error and could not generate the full board package.',
      'Please check the LLM configuration and retry.',
      '',
    ].join('\n');
    const stateDelta: Partial<BoardState> = { reportMarkdown: fallbackMarkdown };
    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'Report compilation failed — minimal fallback report generated.',
      stateDelta,
      durationMs,
      timestamp: new Date().toISOString(),
    } as SSEEvent);
    emit(runId, {
      type: 'execution_complete',
      runId,
      durationMs,
      reportMarkdown: fallbackMarkdown,
      timestamp: new Date().toISOString(),
    } as SSEEvent);
    return stateDelta;
  }
}
