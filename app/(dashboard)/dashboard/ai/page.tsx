'use client';

import { FormEvent, useState } from 'react';
import { Button, Card, Input, Label, Spinner, TextArea } from '@heroui/react';
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Sparkles,
  Target,
  TriangleAlert
} from 'lucide-react';
import type { LaunchPlan } from '@/lib/ai/launch-plan';

type GenerateState =
  | { status: 'idle'; error?: undefined; plan?: undefined }
  | { status: 'loading'; error?: undefined; plan?: undefined }
  | { status: 'error'; error: string; plan?: undefined }
  | { status: 'success'; error?: undefined; plan: LaunchPlan };

export default function AiLaunchPlanPage() {
  const [state, setState] = useState<GenerateState>({ status: 'idle' });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: 'loading' });

    const formData = new FormData(event.currentTarget);
    const payload = {
      product: String(formData.get('product') || ''),
      audience: String(formData.get('audience') || ''),
      goal: String(formData.get('goal') || ''),
      constraints: String(formData.get('constraints') || '')
    };

    const response = await fetch('/api/ai/launch-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      setState({
        status: 'error',
        error: result.error || 'Failed to generate launch plan.'
      });
      return;
    }

    setState({ status: 'success', plan: result.plan });
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Ship AI</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">
            AI Launch Plan
          </h1>
        </div>
        <div className="rounded bg-surface px-3 py-2 text-sm text-muted">
          Structured generation
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="h-fit">
          <Card.Header>
            <Card.Title>Launch brief</Card.Title>
            <Card.Description>
              Turn a product idea into positioning, rollout tasks, risks, and
              launch email copy.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="product" className="mb-2">
                  Product
                </Label>
                <Input
                  id="product"
                  name="product"
                  placeholder="AI bookkeeping for freelancers"
                  required
                  fullWidth
                />
              </div>
              <div>
                <Label htmlFor="audience" className="mb-2">
                  Audience
                </Label>
                <Input
                  id="audience"
                  name="audience"
                  placeholder="Solo consultants and small agencies"
                  required
                  fullWidth
                />
              </div>
              <div>
                <Label htmlFor="goal" className="mb-2">
                  Goal
                </Label>
                <Input
                  id="goal"
                  name="goal"
                  placeholder="Get 50 trial signups in two weeks"
                  required
                  fullWidth
                />
              </div>
              <div>
                <Label htmlFor="constraints" className="mb-2">
                  Constraints
                </Label>
                <TextArea
                  id="constraints"
                  name="constraints"
                  placeholder="Small team, no paid ads, existing email list"
                  rows={4}
                  fullWidth
                />
              </div>
              <Button
                type="submit"
                isDisabled={state.status === 'loading'}
                fullWidth
              >
                {state.status === 'loading' ? (
                  <>
                    <Spinner color="current" size="sm" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate plan
                  </>
                )}
              </Button>
            </form>
          </Card.Content>
        </Card>

        <div className="space-y-4">
          {state.status === 'idle' ? <EmptyState /> : null}
          {state.status === 'loading' ? <LoadingState /> : null}
          {state.status === 'error' ? <ErrorState error={state.error} /> : null}
          {state.status === 'success' ? <LaunchPlanView plan={state.plan} /> : null}
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <Card>
      <Card.Content>
        <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded bg-surface-secondary">
            <Sparkles className="size-6 text-muted" />
          </div>
          <h2 className="text-lg font-semibold">Generate your first plan</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            The result is returned as typed sections, so it can power a real UI
            instead of one long assistant message.
          </p>
        </div>
      </Card.Content>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card>
      <Card.Content>
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
          <Spinner />
          <p className="text-sm text-muted">Building launch plan...</p>
        </div>
      </Card.Content>
    </Card>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <Card>
      <Card.Content>
        <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-4 size-10 text-danger" />
          <h2 className="text-lg font-semibold">Generation failed</h2>
          <p className="mt-2 max-w-md text-sm text-muted">{error}</p>
        </div>
      </Card.Content>
    </Card>
  );
}

function LaunchPlanView({ plan }: { plan: LaunchPlan }) {
  return (
    <>
      <Card>
        <Card.Header className="flex-row items-center justify-between">
          <div>
            <Card.Title>{plan.positioning.headline}</Card.Title>
            <Card.Description>{plan.positioning.promise}</Card.Description>
          </div>
          <Target className="size-5 text-muted" />
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-muted">
            Primary audience: {plan.positioning.primaryAudience}
          </p>
        </Card.Content>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Launch steps</Card.Title>
            <Card.Description>Work the team can execute now.</Card.Description>
          </Card.Header>
          <Card.Content>
            <ul className="divide-y divide-border">
              {plan.launchSteps.map((step) => (
                <li key={step.title} className="py-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {step.owner}: {step.outcome}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Risks</Card.Title>
            <Card.Description>Likely blockers and mitigations.</Card.Description>
          </Card.Header>
          <Card.Content>
            <ul className="divide-y divide-border">
              {plan.risks.map((item) => (
                <li key={item.risk} className="py-3">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                    <div>
                      <p className="text-sm font-medium">{item.risk}</p>
                      <p className="mt-1 text-xs text-muted">
                        {item.mitigation}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header className="flex-row items-center justify-between">
          <div>
            <Card.Title>Activation email</Card.Title>
            <Card.Description>{plan.activationEmail.preview}</Card.Description>
          </div>
          <Mail className="size-5 text-muted" />
        </Card.Header>
        <Card.Content>
          <div className="rounded bg-surface-secondary p-4">
            <p className="text-sm font-medium">{plan.activationEmail.subject}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted">
              {plan.activationEmail.body}
            </p>
          </div>
        </Card.Content>
      </Card>
    </>
  );
}
