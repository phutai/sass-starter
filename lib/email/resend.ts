import 'server-only';

import { Resend } from 'resend';

type SendTeamInvitationEmailParams = {
  to: string;
  teamName: string;
  role: string;
  inviteUrl: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || 'ACME <onboarding@resend.dev>';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function sendTeamInvitationEmail({
  to,
  teamName,
  role,
  inviteUrl
}: SendTeamInvitationEmailParams) {
  if (!resend) {
    return {
      sent: false,
      error: 'RESEND_API_KEY is not configured.'
    };
  }

  const safeTeamName = escapeHtml(teamName);
  const safeRole = escapeHtml(role);
  const safeInviteUrl = escapeHtml(inviteUrl);

  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to,
    subject: `You're invited to join ${teamName}`,
    html: `
      <p>You have been invited to join <strong>${safeTeamName}</strong> as a ${safeRole}.</p>
      <p><a href="${safeInviteUrl}">Accept invitation</a></p>
    `
  });

  if (error) {
    return {
      sent: false,
      error: error.message
    };
  }

  return { sent: true };
}
