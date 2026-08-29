import { NextRequest } from 'next/server';
import {
  generateLaunchPlan,
  launchPlanInputSchema
} from '@/lib/ai/launch-plan';
import { getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = launchPlanInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.errors[0]?.message || 'Invalid request' },
      { status: 400 }
    );
  }

  try {
    const plan = await generateLaunchPlan(parsed.data);
    return Response.json({ plan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate launch plan.';
    const status = message.includes('configured') ? 503 : 500;

    return Response.json({ error: message }, { status });
  }
}
