import 'server-only';

import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

export const launchPlanInputSchema = z.object({
  product: z.string().min(3).max(120),
  audience: z.string().min(3).max(160),
  goal: z.string().min(3).max(200),
  constraints: z.string().max(600).optional()
});

export const launchPlanSchema = z.object({
  positioning: z.object({
    headline: z.string(),
    promise: z.string(),
    primaryAudience: z.string()
  }),
  launchSteps: z.array(
    z.object({
      title: z.string(),
      owner: z.string(),
      outcome: z.string()
    })
  ),
  risks: z.array(
    z.object({
      risk: z.string(),
      mitigation: z.string()
    })
  ),
  activationEmail: z.object({
    subject: z.string(),
    preview: z.string(),
    body: z.string()
  })
});

export type LaunchPlan = z.infer<typeof launchPlanSchema>;
export type LaunchPlanInput = z.infer<typeof launchPlanInputSchema>;

function getAiConfig() {
  const provider = process.env.AI_PROVIDER || 'openai';
  const isVllm = provider === 'vllm';
  const apiKey = isVllm
    ? process.env.VLLM_API_KEY || 'not-needed'
    : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  return {
    provider,
    apiKey,
    model: isVllm
      ? process.env.VLLM_MODEL || 'Qwen3.8-27B'
      : process.env.AI_MODEL || 'gpt-4o-mini',
    maxTokens: isVllm ? 3000 : 1400,
    baseURL: isVllm
      ? process.env.VLLM_BASE_URL || 'http://127.0.0.1:8000/v1'
      : process.env.OPENAI_BASE_URL
  };
}

export async function generateLaunchPlan(input: LaunchPlanInput) {
  const { provider, apiKey, model: modelName, maxTokens, baseURL } =
    getAiConfig();

  const model = new ChatOpenAI({
    apiKey,
    model: modelName,
    temperature: provider === 'vllm' ? 0.2 : 0.4,
    maxTokens,
    ...(baseURL ? { configuration: { baseURL } } : {})
  });

  const structuredModel = model.withStructuredOutput(launchPlanSchema, {
    name: 'launch_plan',
    ...(provider === 'vllm'
      ? { method: 'jsonMode' as const }
      : { method: 'jsonSchema' as const, strict: true })
  });

  return structuredModel.invoke([
    {
      role: 'system',
      content:
        '/no_think\nReturn only valid compact JSON. No markdown. Create a practical SaaS launch plan with these exact sections: positioning {headline,promise,primaryAudience}; launchSteps array of 3 objects {title,owner,outcome}; risks array of 2 objects {risk,mitigation}; activationEmail {subject,preview,body}.'
    },
    {
      role: 'user',
      content: JSON.stringify(input)
    }
  ]);
}
