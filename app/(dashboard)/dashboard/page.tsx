'use client';

import { Suspense, useActionState, useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Input,
  Label,
  Radio,
  RadioGroup,
  Spinner
} from '@heroui/react';
import {
  ArrowUpRight,
  Clipboard,
  CreditCard,
  MailPlus,
  PlusCircle,
  ShieldCheck,
  Users,
  XCircle
} from 'lucide-react';
import useSWR, { useSWRConfig } from 'swr';
import {
  inviteTeamMember,
  removeTeamMember,
  resendInvitation,
  revokeInvitation
} from '@/app/(login)/actions';
import { customerPortalAction } from '@/lib/payments/actions';
import { TeamDataWithMembers, User } from '@/lib/db/schema';

type ActionState = {
  error?: string;
  success?: string;
  invitationId?: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getUserDisplayName(user: Pick<User, 'id' | 'name' | 'email'>) {
  return user.name || user.email || 'Unknown User';
}

function getInitials(value: string) {
  return value
    .split(/[ @.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function SubscriptionSkeleton() {
  return (
    <Card className="h-[196px]">
      <Card.Header>
        <Card.Title>Subscription</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="h-20 animate-pulse rounded bg-default" />
      </Card.Content>
    </Card>
  );
}

function ManageSubscription() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const status = teamData?.subscriptionStatus || 'free';
  const statusLabel =
    status === 'active'
      ? 'Active'
      : status === 'trialing'
      ? 'Trialing'
      : 'Free';

  return (
    <Card className="h-full">
      <Card.Header className="flex-row items-center justify-between">
        <div>
          <Card.Title>Subscription</Card.Title>
          <Card.Description>Plan and billing controls</Card.Description>
        </div>
        <CreditCard className="size-5 text-muted" />
      </Card.Header>
      <Card.Content>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold tracking-normal">
              {teamData?.planName || 'Free'}
            </p>
            <p className="mt-1 text-sm text-muted">{statusLabel} plan</p>
          </div>
          <div className="rounded bg-surface-secondary px-3 py-2 text-right">
            <p className="text-xs text-muted">Renewal</p>
            <p className="text-sm font-medium">
              {status === 'active' ? 'Monthly' : 'Not set'}
            </p>
          </div>
        </div>
      </Card.Content>
      <Card.Footer>
        <form action={customerPortalAction} className="w-full">
          <Button
            className="w-full justify-center"
            type="submit"
            variant="outline"
          >
            Manage billing
            <ArrowUpRight className="size-4" />
          </Button>
        </form>
      </Card.Footer>
    </Card>
  );
}

function TeamSnapshot() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const memberCount = teamData?.teamMembers?.length ?? 0;
  const ownerCount =
    teamData?.teamMembers?.filter((member) => member.role === 'owner').length ??
    0;
  const pendingInviteCount = teamData?.invitations?.length ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card>
        <Card.Header className="flex-row items-center justify-between">
          <Card.Title className="text-sm">Members</Card.Title>
          <Users className="size-4 text-muted" />
        </Card.Header>
        <Card.Content>
          <p className="text-3xl font-semibold">{memberCount}</p>
          <p className="mt-1 text-sm text-muted">People in this workspace</p>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header className="flex-row items-center justify-between">
          <Card.Title className="text-sm">Owners</Card.Title>
          <ShieldCheck className="size-4 text-muted" />
        </Card.Header>
        <Card.Content>
          <p className="text-3xl font-semibold">{ownerCount}</p>
          <p className="mt-1 text-sm text-muted">Can manage billing and team</p>
        </Card.Content>
      </Card>
      <Card className="sm:col-span-2 xl:col-span-1">
        <Card.Header className="flex-row items-center justify-between">
          <Card.Title className="text-sm">Invites</Card.Title>
          <MailPlus className="size-4 text-muted" />
        </Card.Header>
        <Card.Content>
          <p className="text-3xl font-semibold">{pendingInviteCount}</p>
          <p className="mt-1 text-sm text-muted">Pending workspace invites</p>
        </Card.Content>
      </Card>
    </div>
  );
}

function TeamMembersSkeleton() {
  return (
    <Card className="h-[320px]">
      <Card.Header>
        <Card.Title>Team Members</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded bg-default" />
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

function TeamMembers() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const [removeState, removeAction, isRemovePending] = useActionState<
    ActionState,
    FormData
  >(removeTeamMember, {});

  if (!teamData?.teamMembers?.length) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>Team Members</Card.Title>
          <Card.Description>No team members yet.</Card.Description>
        </Card.Header>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between">
        <div>
          <Card.Title>Team Members</Card.Title>
          <Card.Description>Access and roles for this workspace</Card.Description>
        </div>
        <span className="rounded bg-default px-2.5 py-1 text-xs font-medium">
          {teamData.teamMembers.length} total
        </span>
      </Card.Header>
      <Card.Content>
        <ul className="divide-y divide-border">
          {teamData.teamMembers.map((member, index) => {
            const displayName = getUserDisplayName(member.user);

            return (
              <li
                key={member.id}
                className="flex min-h-16 items-center justify-between gap-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-10">
                    <Avatar.Fallback>
                      {getInitials(displayName)}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded bg-surface-secondary px-2.5 py-1 text-xs font-medium capitalize">
                    {member.role}
                  </span>
                  {index > 1 ? (
                    <form action={removeAction}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        isDisabled={isRemovePending}
                      >
                        {isRemovePending ? 'Removing...' : 'Remove'}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {removeState?.error && (
          <p className="mt-4 text-sm text-danger">{removeState.error}</p>
        )}
      </Card.Content>
    </Card>
  );
}

function InviteTeamMemberSkeleton() {
  return (
    <Card className="h-[320px]">
      <Card.Header>
        <Card.Title>Invite Team Member</Card.Title>
      </Card.Header>
    </Card>
  );
}

function InviteTeamMember() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { mutate } = useSWRConfig();
  const isOwner = user?.role === 'owner';
  const [inviteState, inviteAction, isInvitePending] = useActionState<
    ActionState,
    FormData
  >(inviteTeamMember, {});

  useEffect(() => {
    if (inviteState?.success || inviteState?.invitationId) {
      mutate('/api/team');
    }
  }, [inviteState?.invitationId, inviteState?.success, mutate]);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Invite Team Member</Card.Title>
        <Card.Description>Add a teammate with the right role.</Card.Description>
      </Card.Header>
      <Card.Content>
        <form action={inviteAction} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="teammate@example.com"
              required
              disabled={!isOwner}
              fullWidth
            />
          </div>
          <RadioGroup defaultValue="member" name="role" isDisabled={!isOwner}>
            <Label>Role</Label>
            <Radio value="member">
              <Radio.Content>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                Member
              </Radio.Content>
            </Radio>
            <Radio value="owner">
              <Radio.Content>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                Owner
              </Radio.Content>
            </Radio>
          </RadioGroup>
          {inviteState?.error && (
            <p className="text-sm text-danger">{inviteState.error}</p>
          )}
          {inviteState?.success && (
            <p className="text-sm text-success">{inviteState.success}</p>
          )}
          <Button type="submit" isDisabled={isInvitePending || !isOwner}>
            {isInvitePending ? (
              <>
                <Spinner color="current" size="sm" className="mr-2" />
                Inviting...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 size-4" />
                Invite member
              </>
            )}
          </Button>
        </form>
      </Card.Content>
      {!isOwner ? (
        <Card.Footer>
          <p className="text-sm text-muted">
            You must be a team owner to invite new members.
          </p>
        </Card.Footer>
      ) : null}
    </Card>
  );
}

function PendingInvitationsSkeleton() {
  return (
    <Card className="h-[220px]">
      <Card.Header>
        <Card.Title>Pending Invites</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="space-y-3">
          {[0, 1].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded bg-default" />
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

function PendingInvitations() {
  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { mutate } = useSWRConfig();
  const [copiedInvitationId, setCopiedInvitationId] = useState<number | null>(
    null
  );
  const [revokeState, revokeAction, isRevokePending] = useActionState<
    ActionState,
    FormData
  >(revokeInvitation, {});
  const [resendState, resendAction, isResendPending] = useActionState<
    ActionState,
    FormData
  >(resendInvitation, {});
  const invitations = teamData?.invitations ?? [];

  useEffect(() => {
    if (revokeState?.success) {
      mutate('/api/team');
    }
  }, [mutate, revokeState?.success]);

  async function copyInviteLink(invitationId: number) {
    const invitePath = `/sign-up?inviteId=${invitationId}`;
    const inviteUrl =
      typeof window === 'undefined'
        ? invitePath
        : new URL(invitePath, window.location.origin).toString();

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedInvitationId(invitationId);
    }
  }

  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between">
        <div>
          <Card.Title>Pending Invites</Card.Title>
          <Card.Description>Copy invite links or revoke access.</Card.Description>
        </div>
        <span className="rounded bg-default px-2.5 py-1 text-xs font-medium">
          {invitations.length} open
        </span>
      </Card.Header>
      <Card.Content>
        {invitations.length > 0 ? (
          <ul className="divide-y divide-border">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex min-h-16 flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {invitation.email}
                  </p>
                  <p className="text-xs text-muted">
                    {invitation.role} invited{' '}
                    {new Date(invitation.invitedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => copyInviteLink(invitation.id)}
                  >
                    <Clipboard className="size-4" />
                    {copiedInvitationId === invitation.id ? 'Copied' : 'Copy'}
                  </Button>
                  <form action={resendAction}>
                    <input
                      type="hidden"
                      name="invitationId"
                      value={invitation.id}
                    />
                    <Button
                      size="sm"
                      type="submit"
                      variant="secondary"
                      isDisabled={isResendPending}
                    >
                      <MailPlus className="size-4" />
                      Resend
                    </Button>
                  </form>
                  <form action={revokeAction}>
                    <input
                      type="hidden"
                      name="invitationId"
                      value={invitation.id}
                    />
                    <Button
                      size="sm"
                      type="submit"
                      variant="outline"
                      isDisabled={isRevokePending}
                    >
                      <XCircle className="size-4" />
                      Revoke
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded border border-border bg-surface-secondary p-4">
            <p className="text-sm font-medium">No pending invites</p>
            <p className="mt-1 text-sm text-muted">
              New invitations will appear here with copyable sign-up links.
            </p>
          </div>
        )}
        {revokeState?.error && (
          <p className="mt-4 text-sm text-danger">{revokeState.error}</p>
        )}
        {resendState?.error && (
          <p className="mt-4 text-sm text-danger">{resendState.error}</p>
        )}
        {revokeState?.success && (
          <p className="mt-4 text-sm text-success">{revokeState.success}</p>
        )}
        {resendState?.success && (
          <p className="mt-4 text-sm text-success">{resendState.success}</p>
        )}
      </Card.Content>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">
            Team Settings
          </h1>
        </div>
      </div>

      <div className="space-y-4">
        <Suspense fallback={<div className="h-[132px] rounded bg-default" />}>
          <TeamSnapshot />
        </Suspense>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <Suspense fallback={<TeamMembersSkeleton />}>
              <TeamMembers />
            </Suspense>
            <Suspense fallback={<PendingInvitationsSkeleton />}>
              <PendingInvitations />
            </Suspense>
          </div>
          <div className="space-y-4">
            <Suspense fallback={<SubscriptionSkeleton />}>
              <ManageSubscription />
            </Suspense>
            <Suspense fallback={<InviteTeamMemberSkeleton />}>
              <InviteTeamMember />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
