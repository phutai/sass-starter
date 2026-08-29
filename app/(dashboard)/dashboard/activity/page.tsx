import { Card } from '@heroui/react';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.RESEND_INVITATION]: Mail,
  [ActivityType.REVOKE_INVITATION]: UserMinus,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.SIGN_IN_WITH_OAUTH]: UserCog,
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up';
    case ActivityType.SIGN_IN:
      return 'You signed in';
    case ActivityType.SIGN_OUT:
      return 'You signed out';
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password';
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account';
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account';
    case ActivityType.CREATE_TEAM:
      return 'You created a new team';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member';
    case ActivityType.RESEND_INVITATION:
      return 'You resent an invitation';
    case ActivityType.REVOKE_INVITATION:
      return 'You revoked an invitation';
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation';
    case ActivityType.SIGN_IN_WITH_OAUTH:
      return 'You signed in with OAuth';
    default:
      return 'Unknown action occurred';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Audit</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">
            Activity Log
          </h1>
        </div>
        <div className="rounded bg-surface px-3 py-2 text-sm text-muted">
          {logs.length} event{logs.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <Card.Header>
            <Card.Title className="text-sm">Event Coverage</Card.Title>
            <Card.Description>Account and team actions</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3">
            <div className="flex items-center justify-between rounded bg-surface-secondary p-3">
              <span className="text-sm font-medium">Recorded</span>
              <span className="text-sm text-muted">{logs.length}</span>
            </div>
            <div className="flex items-center justify-between rounded bg-surface-secondary p-3">
              <span className="text-sm font-medium">Source</span>
              <span className="text-sm text-muted">Workspace</span>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
            <Card.Description>
              Latest sign-in, account, and team events.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {logs.length > 0 ? (
              <ul className="divide-y divide-border">
                {logs.map((log) => {
                  const Icon = iconMap[log.action as ActivityType] || Settings;
                  const formattedAction = formatAction(
                    log.action as ActivityType
                  );

                  return (
                    <li key={log.id} className="flex items-center gap-4 py-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded bg-surface-secondary">
                        <Icon className="size-5 text-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {formattedAction}
                          {log.ipAddress && ` from IP ${log.ipAddress}`}
                        </p>
                        <p className="text-xs text-muted">
                          {getRelativeTime(new Date(log.timestamp))}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="mb-4 flex size-12 items-center justify-center rounded bg-surface-secondary">
                  <AlertCircle className="size-6 text-muted" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">No activity yet</h3>
                <p className="text-sm text-muted max-w-sm">
                  When you perform actions like signing in or updating your
                  account, they'll appear here.
                </p>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </section>
  );
}
