import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { NODE_REGISTRY } from '@/data/nodeRegistry';
import { getOpenAIClient, getModel } from '@/lib/openaiClient';

export const runtime = 'nodejs';

const agentList = Object.values(NODE_REGISTRY)
  .map((n) => `- ${n.id}: ${n.label} (${n.badgeLabel}) — ${n.description}`)
  .join('\n');

const SYSTEM_PROMPT = `You are Sentinel, an AI system for bank board reporting.

When a user describes their meeting, recommend agents one at a time. For each recommendation:
1. Explain in one sentence why this agent is needed for their situation
2. Include the agent ID in your JSON response as "recommendedAgentId"

Available agents:
${agentList}

Respond in JSON format:
{
  "reply": "Your conversational response here",
  "recommendedAgentId": "agent_id_here_or_null",
  "recommendedScenarioId": "falcon-board" | "audit-committee" | "risk-flash" | null
}

Rules:
- Always recommend meta_agent and report_compiler as the first and last agents respectively.
- Recommend agents based on what the user describes:
  - Financial metrics concerns → financial_aggregator, capital_monitor
  - CRE or credit issues → credit_quality, trend_analyzer
  - Regulatory, MRA, exam concerns → regulatory_digest
  - Incidents, fraud, vendor issues → operational_risk
  - Full board package → all agents
- When user says done/configure/ready → set recommendedAgentId to null and confirm their graph
- recommendedScenarioId: set to the closest matching scenario when confident, null otherwise
- Be concise — 2-4 sentences max per reply`;

export async function POST(req: NextRequest) {
  let message: string;
  let currentScenarioId: string;

  try {
    const body = await req.json() as { message?: unknown; currentScenarioId?: unknown };
    if (typeof body.message !== 'string' || !body.message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    message = body.message.trim();
    currentScenarioId = typeof body.currentScenarioId === 'string' ? body.currentScenarioId : 'falcon-board';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  const client = getOpenAIClient();
  const model = getModel();

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Current scenario selected: ${currentScenarioId}\n\nUser message: ${message}`,
        },
      ],
      max_completion_tokens: 400,
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: { reply?: string; recommendedAgentId?: string | null; recommendedScenarioId?: string | null };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      parsed = { reply: raw, recommendedAgentId: null, recommendedScenarioId: null };
    }

    const validScenarios = ['falcon-board', 'audit-committee', 'risk-flash'];
    const validAgents = Object.keys(NODE_REGISTRY);

    return NextResponse.json({
      reply: parsed.reply ?? 'I can help you configure your board package.',
      recommendedAgentId:
        typeof parsed.recommendedAgentId === 'string' && validAgents.includes(parsed.recommendedAgentId)
          ? parsed.recommendedAgentId
          : null,
      recommendedScenarioId:
        typeof parsed.recommendedScenarioId === 'string' && validScenarios.includes(parsed.recommendedScenarioId)
          ? parsed.recommendedScenarioId
          : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI request failed: ${msg}` }, { status: 500 });
  }
}
