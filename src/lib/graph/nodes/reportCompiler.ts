import type { RunnableConfig } from '@langchain/core/runnables';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { generateBoardPackageDOCX } from '@/lib/docx/generateBoardPackage';
import { emit, storeReportResult } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import {
  REPORT_PREAMBLE,
  SECTION_DEFS,
  deriveRagFromState,
} from '@/lib/prompts/reportCompiler';
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

function buildContextPayload(state: BoardState): string {
  return JSON.stringify({
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
  });
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
    inputSnapshot: { sectionCount: SECTION_DEFS.length, model: getModel() },
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  try {
    const contextPayload = buildContextPayload(state);
    const finalSections: ReportSection[] = [];

    for (const sectionDef of SECTION_DEFS) {
      const ragStatus: RAGStatus | undefined =
        deriveRagFromState(state as unknown as Record<string, unknown>, sectionDef.ragKey);

      emit(runId, {
        type: 'node_progress',
        runId,
        nodeId: nodeMeta.id,
        nodeType: nodeMeta.type,
        step: `Writing section: ${sectionDef.title}…`,
        timestamp: new Date().toISOString(),
      } as SSEEvent);

      emit(runId, {
        type: 'report_section_started',
        runId,
        sectionId: sectionDef.id,
        sectionTitle: sectionDef.title,
        ragStatus,
        timestamp: new Date().toISOString(),
      } as SSEEvent);

      let sectionContent = '';

      try {
        console.log(`[reportCompiler] Starting LLM call for section: ${sectionDef.id} (model: ${getModel()})`);
        const sectionStartTime = Date.now();
        const stream = await getOpenAIClient().chat.completions.create({
          model: getModel(),
          stream: true,
          temperature: 0.4,
          messages: [
            {
              role: 'system',
              content: `${REPORT_PREAMBLE}\n\n## YOUR TASK\n\nWrite the "${sectionDef.title}" section.\n\n${sectionDef.prompt}`,
            },
            { role: 'user', content: contextPayload },
          ],
        });
        console.log(`[reportCompiler] Stream opened for ${sectionDef.id} — awaiting tokens…`);

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) {
            sectionContent += delta;
            emit(runId, {
              type: 'report_token',
              runId,
              sectionId: sectionDef.id,
              token: delta,
              timestamp: new Date().toISOString(),
            } as SSEEvent);
          }
        }
        console.log(`[reportCompiler] Section ${sectionDef.id} complete — ${sectionContent.length} chars in ${Date.now() - sectionStartTime}ms`);
      } catch (sectionErr) {
        console.error(`[reportCompiler] LLM FAILED for ${sectionDef.id}:`, sectionErr);
        sectionContent =
          `> **Error generating this section.** The language model call failed: ${String(sectionErr)}\n\nPlease retry or check the LLM configuration.`;
      }

      emit(runId, {
        type: 'report_section_complete',
        runId,
        sectionId: sectionDef.id,
        timestamp: new Date().toISOString(),
      } as SSEEvent);

      finalSections.push({
        id: sectionDef.id,
        title: sectionDef.title,
        content: sectionContent.trim(),
        ragStatus,
        isStreaming: false,
        isComplete: true,
      });
    }

    emit(runId, {
      type: 'node_progress',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      step: `${finalSections.length} section(s) streamed — generating DOCX…`,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

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

    // Store full results server-side for REST retrieval.
    // The SSE node_completed event is too large with docxBuffer (100KB-500KB+)
    // and gets silently dropped by browsers/proxies, so we send a slim event
    // and let the client fetch the full payload via /api/report/[runId].
    storeReportResult(runId, { reportDraft, reportMarkdown, docxBuffer });

    const durationMs = Date.now() - startedAt;

    // Slim SSE event: omit all heavy fields to keep the frame under ~2KB.
    // The client fetches full report data via /api/report/[runId].
    const slimDelta: Partial<BoardState> = {
      reportDraft: null,
      reportMarkdown: null,
      docxBuffer: null,
    };

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: `Report compiled. ${finalSections.length} sections. DOCX ${(docxBytes / 1024).toFixed(1)} KB.`,
      stateDelta: slimDelta,
      durationMs,
      timestamp: new Date().toISOString(),
    } as SSEEvent);

    emit(runId, {
      type: 'execution_complete',
      runId,
      durationMs,
      reportMarkdown: null,
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
