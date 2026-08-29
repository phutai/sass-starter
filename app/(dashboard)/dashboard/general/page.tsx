'use client';

import { useActionState } from 'react';
import { Button, Card, Input, Label, Spinner } from '@heroui/react';
import { updateAccount } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import { Mail, Save, UserRound } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = ''
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={state.name || nameValue}
          required
          fullWidth
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          required
          fullWidth
        />
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
    />
  );
}

export default function GeneralPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-muted">Profile</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">
          General Settings
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <Card.Header>
              <Card.Title className="text-sm">Account status</Card.Title>
              <Card.Description>Identity and login profile</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-3">
              <div className="flex items-center gap-3 rounded bg-surface-secondary p-3">
                <UserRound className="size-4 text-muted" />
                <span className="text-sm font-medium">Personal account</span>
              </div>
              <div className="flex items-center gap-3 rounded bg-surface-secondary p-3">
                <Mail className="size-4 text-muted" />
                <span className="text-sm font-medium">Email sign-in</span>
              </div>
            </Card.Content>
          </Card>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>Account Information</Card.Title>
            <Card.Description>
              Update the public name and email on your account.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <form className="space-y-4" action={formAction}>
              <Suspense fallback={<AccountForm state={state} />}>
                <AccountFormWithData state={state} />
              </Suspense>
              {state.error && (
                <p className="text-danger text-sm">{state.error}</p>
              )}
              {state.success && (
                <p className="text-success text-sm">{state.success}</p>
              )}
              <Button type="submit" isDisabled={isPending}>
                {isPending ? (
                  <>
                    <Spinner color="current" size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save changes
                  </>
                )}
              </Button>
            </form>
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}
