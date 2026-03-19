import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { buildMetaAgentPrompt } from '@/lib/prompts/metaAgent';
import { getOpenAIClient, getModel } from '@/lib/openaiClient';
import type { ScenarioData } from '@/types/scenarios';

export interface MetaAgentResult {
  topology: string[];
  rationale: string;
}

function buildScenarioProfile(scenario: ScenarioData): string {
  const lines: string[] = [
    `Meeting type: ${scenario.meetingType}`,
    `Institution: ${scenario.institutionName}`,
    `Meeting date: ${scenario.meetingDate}`,
  ];

  if (scenario.financials) {
    lines.push('Data: financial performance metrics present (NIM, ROA, ROE, efficiency ratio)');
  }
  if (scenario.capital) {
    lines.push('Data: capital and liquidity metrics present (CET1, Tier 1, LCR, NSFR)');
  }
  if (scenario.credit) {
    lines.push('Data: credit quality data present (NPL ratio, provision coverage, concentrations)');
  }
  if (scenario.regulatory?.mras?.length) {
    const overdue = scenario.regulatory.mras.filter((m) => m.status === 'overdue').length;
    lines.push(
      `Data: ${scenario.regulatory.mras.length} open MRA(s)${overdue > 0 ? `, ${overdue} overdue — escalation likely required` : ''}`
    );
  }
  if (scenario.regulatory?.exams?.length) {
    lines.push(`Data: ${scenario.regulatory.exams.length} upcoming exam(s)`);
  }
  if (scenario.regulatory?.auditCoverage?.length) {
    lines.push(
      `Data: internal audit coverage present (${scenario.regulatory.auditCoverage.length} areas reviewed)`
    );
  }
  if (scenario.incidents?.length) {
    lines.push(`Data: ${scenario.incidents.length} operational incident(s) on record`);
  }
  if (scenario.hitlRequired) {
    lines.push('HITL review: required before final compilation');
  }

  return lines.join('\n');
}

/**
 * Calls the meta-agent (one OpenAI JSON-mode call) to determine the optimal
 * execution topology for this scenario.
 *
 * FALLBACK: if the API call fails or returns invalid node IDs, derives topology
 * deterministically from scenario.expectedNodes so the demo always works offline.
 */
export async function runMetaAgent(scenario: ScenarioData): Promise<MetaAgentResult> {
  const validNodeIds = new Set(Object.keys(NODE_REGISTRY));

  try {
    const client = getOpenAIClient();
    const model = getModel();

    const systemPrompt = buildMetaAgentPrompt(NODE_REGISTRY);
    const userContent = buildScenarioProfile(scenario);

    const response = await client.chat.completions.create({
      model,
      temperature: 0.0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw) as { topology?: unknown; rationale?: unknown };

    if (!Array.isArray(parsed.topology) || typeof parsed.rationale !== 'string') {
      throw new Error('Meta-agent response missing required fields');
    }

    const topology = (parsed.topology as unknown[]).filter(
      (id): id is string => typeof id === 'string' && validNodeIds.has(id)
    );

    if (topology.length < 2) {
      throw new Error(`Meta-agent returned only ${topology.length} valid node ID(s)`);
    }

    return { topology, rationale: parsed.rationale };
  } catch {
    // Deterministic fallback — always works offline or when API is unavailable
    return {
      topology: scenario.expectedNodes.filter((id) => validNodeIds.has(id)),
      rationale:
        'Fallback topology derived from scenario definition (API unavailable or response invalid).',
    };
  }
}
