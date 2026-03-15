import type { RunnableConfig } from '@langchain/core/runnables';
import OpenAI from 'openai';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { generateBoardPackageDOCX } from '@/lib/docx/generateBoardPackage';
import { emit } from '@/lib/eventEmitter';
import type { BoardState } from '@/lib/graph/state';
import { REPORT_COMPILER_PROMPT } from '@/lib/prompts/reportCompiler';
import type { ReportDraft, ReportSection } from '@/types/state';
import type { SSEEvent } from '@/types/events';

const nodeMeta = NODE_REGISTRY.report_compiler;
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

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
    timestamp: new Date(startedAt).toISOString(),
  } as SSEEvent);

  try {
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

    const response = await getOpenAI().chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.4,
      messages: [
        { role: 'system', content: REPORT_COMPILER_PROMPT },
        { role: 'user', content: JSON.stringify(context) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as { sections: ReportSection[]; metadata: ReportDraft['metadata'] };

    const reportDraft: ReportDraft = {
      sections: parsed.sections,
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
      outputSummary: `Report compiled. ${reportDraft.sections.length} sections. DOCX ${(docxBytes / 1024).toFixed(1)} KB.`,
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

    emit(runId, {
      type: 'node_completed',
      runId,
      nodeId: nodeMeta.id,
      nodeType: nodeMeta.type,
      label: nodeMeta.label,
      outputSummary: 'Report compilation failed - state unchanged.',
      stateDelta: {},
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

    return {};
  }
}
