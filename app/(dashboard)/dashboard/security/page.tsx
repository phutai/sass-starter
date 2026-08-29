'use client';

import { Button, Card, Input, Label, Spinner } from '@heroui/react';
import { KeyRound, Lock, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { useActionState } from 'react';
import { updatePassword, deleteAccount } from '@/app/(login)/actions';

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

export default function SecurityPage() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-muted">Access</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">
          Security Settings
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <Card.Header>
              <Card.Title className="text-sm">Protection</Card.Title>
              <Card.Description>Password and account controls</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-3">
              <div className="flex items-center gap-3 rounded bg-surface-secondary p-3">
                <ShieldCheck className="size-4 text-success" />
                <span className="text-sm font-medium">Session cookies</span>
              </div>
              <div className="flex items-center gap-3 rounded bg-surface-secondary p-3">
                <KeyRound className="size-4 text-muted" />
                <span className="text-sm font-medium">Password login</span>
              </div>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title className="text-sm">Danger Zone</Card.Title>
              <Card.Description>Permanent account changes</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="flex items-start gap-3 rounded border border-danger/25 bg-danger/10 p-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" />
                <p className="text-sm text-muted">
                  Account deletion removes your user and team membership data.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <Card.Header>
              <Card.Title>Password</Card.Title>
              <Card.Description>Change the password used for email sign-in.</Card.Description>
            </Card.Header>
            <Card.Content>
              <form className="space-y-4" action={passwordAction}>
                <div>
                  <Label htmlFor="current-password" className="mb-2">
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    name="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                    minLength={8}
                    maxLength={100}
                    defaultValue={passwordState.currentPassword}
                    fullWidth
                  />
                </div>
                <div>
                  <Label htmlFor="new-password" className="mb-2">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={100}
                    defaultValue={passwordState.newPassword}
                    fullWidth
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="mb-2">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    maxLength={100}
                    defaultValue={passwordState.confirmPassword}
                    fullWidth
                  />
                </div>
                {passwordState.error && (
                  <p className="text-sm text-danger">{passwordState.error}</p>
                )}
                {passwordState.success && (
                  <p className="text-sm text-success">{passwordState.success}</p>
                )}
                <Button type="submit" isDisabled={isPasswordPending}>
                  {isPasswordPending ? (
                    <>
                      <Spinner color="current" size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 size-4" />
                      Update password
                    </>
                  )}
                </Button>
              </form>
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Delete Account</Card.Title>
              <Card.Description>
                Account deletion is permanent and cannot be undone.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <form action={deleteAction} className="space-y-4">
                <div>
                  <Label htmlFor="delete-password" className="mb-2">
                    Confirm Password
                  </Label>
                  <Input
                    id="delete-password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={100}
                    defaultValue={deleteState.password}
                    fullWidth
                  />
                </div>
                {deleteState.error && (
                  <p className="text-sm text-danger">{deleteState.error}</p>
                )}
                <Button
                  type="submit"
                  variant="danger"
                  isDisabled={isDeletePending}
                >
                  {isDeletePending ? (
                    <>
                      <Spinner color="current" size="sm" className="mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 size-4" />
                      Delete account
                    </>
                  )}
                </Button>
              </form>
            </Card.Content>
          </Card>
        </div>
      </div>
    </section>
  );
}
