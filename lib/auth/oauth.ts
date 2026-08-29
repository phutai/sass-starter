import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/drizzle';
import {
  ActivityType,
  activityLogs,
  invitations,
  oauthAccounts,
  teamMembers,
  teams,
  users,
  type NewActivityLog,
  type NewTeam,
  type NewTeamMember,
  type NewUser
} from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { createCheckoutSession } from '@/lib/payments/stripe';

export type OAuthProvider = 'google' | 'facebook';

type OAuthConfig = {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scope: string;
};

type OAuthProfile = {
  id: string;
  email: string;
  name?: string;
};

const configs: Record<OAuthProvider, OAuthConfig> = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    scope: 'openid email profile'
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v20.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v20.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email',
    clientIdEnv: 'FACEBOOK_CLIENT_ID',
    clientSecretEnv: 'FACEBOOK_CLIENT_SECRET',
    scope: 'email public_profile'
  }
};

const stateCookiePrefix = 'oauth_state_';
const redirectCookiePrefix = 'oauth_redirect_';
const priceCookiePrefix = 'oauth_price_';
const inviteCookiePrefix = 'oauth_invite_';
const secureCookies = process.env.NODE_ENV === 'production';

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'facebook';
}

export function getOAuthConfig(provider: OAuthProvider) {
  return configs[provider];
}

export function getOAuthClientCredentials(provider: OAuthProvider) {
  const config = getOAuthConfig(provider);
  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    throw new Error(
      `${config.clientIdEnv} and ${config.clientSecretEnv} must be set.`
    );
  }

  return { clientId, clientSecret };
}

export function getOAuthRedirectUri(
  request: NextRequest,
  provider: OAuthProvider
) {
  const baseUrl = process.env.BASE_URL || request.nextUrl.origin;
  return `${baseUrl}/api/auth/${provider}/callback`;
}

export async function redirectToOAuthProvider(
  request: NextRequest,
  provider: OAuthProvider
) {
  const config = getOAuthConfig(provider);
  const { clientId } = getOAuthClientCredentials(provider);
  const state = crypto.randomUUID();
  const searchParams = request.nextUrl.searchParams;
  const redirectTo = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');

  const cookieStore = await cookies();
  cookieStore.set(`${stateCookiePrefix}${provider}`, state, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/'
  });

  if (redirectTo) {
    cookieStore.set(`${redirectCookiePrefix}${provider}`, redirectTo, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/'
    });
  }

  if (priceId) {
    cookieStore.set(`${priceCookiePrefix}${provider}`, priceId, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/'
    });
  }

  if (inviteId) {
    cookieStore.set(`${inviteCookiePrefix}${provider}`, inviteId, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/'
    });
  }

  const authorizationUrl = new URL(config.authUrl);
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set(
    'redirect_uri',
    getOAuthRedirectUri(request, provider)
  );
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', config.scope);
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(authorizationUrl);
}

export async function handleOAuthCallback(
  request: NextRequest,
  provider: OAuthProvider
) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(`${stateCookiePrefix}${provider}`)?.value;

  cookieStore.delete(`${stateCookiePrefix}${provider}`);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/sign-in?error=oauth', request.url));
  }

  const redirectTo = cookieStore.get(`${redirectCookiePrefix}${provider}`)?.value;
  const priceId = cookieStore.get(`${priceCookiePrefix}${provider}`)?.value;
  const inviteId = cookieStore.get(`${inviteCookiePrefix}${provider}`)?.value;
  cookieStore.delete(`${redirectCookiePrefix}${provider}`);
  cookieStore.delete(`${priceCookiePrefix}${provider}`);
  cookieStore.delete(`${inviteCookiePrefix}${provider}`);

  try {
    const profile = await getOAuthProfile(request, provider, code);
    const { user, team } = await findOrCreateOAuthUser(
      provider,
      profile,
      inviteId
    );

    await Promise.all([
      setSession(user),
      logActivity(team.id, user.id, ActivityType.SIGN_IN_WITH_OAUTH)
    ]);

    if (redirectTo === 'checkout' && priceId) {
      await createCheckoutSession({ team, priceId });
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('OAuth callback failed:', error);
    return NextResponse.redirect(new URL('/sign-in?error=oauth', request.url));
  }
}

async function getOAuthProfile(
  request: NextRequest,
  provider: OAuthProvider,
  code: string
): Promise<OAuthProfile> {
  const config = getOAuthConfig(provider);
  const { clientId, clientSecret } = getOAuthClientCredentials(provider);
  const redirectUri = getOAuthRedirectUri(request, provider);

  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to exchange ${provider} OAuth code.`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken =
    typeof tokenData.access_token === 'string' ? tokenData.access_token : null;

  if (!accessToken) {
    throw new Error(`No ${provider} OAuth access token returned.`);
  }

  const userInfoResponse = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!userInfoResponse.ok) {
    throw new Error(`Failed to fetch ${provider} user profile.`);
  }

  const userInfo = await userInfoResponse.json();
  const id = provider === 'google' ? userInfo.sub : userInfo.id;
  const email = typeof userInfo.email === 'string' ? userInfo.email : null;

  if (!id || !email) {
    throw new Error(`${provider} did not return an email address.`);
  }

  return {
    id,
    email: email.toLowerCase(),
    name: typeof userInfo.name === 'string' ? userInfo.name : undefined
  };
}

async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  profile: OAuthProfile,
  inviteId?: string
) {
  const existingAccount = await db
    .select({
      user: users,
      team: teams
    })
    .from(oauthAccounts)
    .innerJoin(users, eq(oauthAccounts.userId, users.id))
    .innerJoin(teamMembers, eq(users.id, teamMembers.userId))
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(
      and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, profile.id)
      )
    )
    .limit(1);

  if (existingAccount[0]) {
    return existingAccount[0];
  }

  const existingUserWithTeam = await db
    .select({
      user: users,
      team: teams
    })
    .from(users)
    .innerJoin(teamMembers, eq(users.id, teamMembers.userId))
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(users.email, profile.email))
    .limit(1);

  if (existingUserWithTeam[0]) {
    const { user, team } = existingUserWithTeam[0];
    await linkOAuthAccount(user.id, provider, profile.id);
    return { user, team };
  }

  const newUser: NewUser = {
    email: profile.email,
    name: profile.name,
    passwordHash: null,
    role: 'owner'
  };

  const [user] = await db.insert(users).values(newUser).returning();
  if (!user) {
    throw new Error('Failed to create OAuth user.');
  }

  let teamId: number;
  let userRole: string;
  let team: typeof teams.$inferSelect | null = null;

  if (inviteId) {
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.id, parseInt(inviteId)),
          eq(invitations.email, profile.email),
          eq(invitations.status, 'pending')
        )
      )
      .limit(1);

    if (!invitation) {
      throw new Error('Invalid or expired invitation.');
    }

    teamId = invitation.teamId;
    userRole = invitation.role;

    await db
      .update(invitations)
      .set({ status: 'accepted' })
      .where(eq(invitations.id, invitation.id));

    [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) {
      throw new Error('Invited team was not found.');
    }
  } else {
    const newTeam: NewTeam = {
      name: `${profile.email}'s Team`
    };
    [team] = await db.insert(teams).values(newTeam).returning();

    if (!team) {
      throw new Error('Failed to create OAuth user team.');
    }

    teamId = team.id;
    userRole = 'owner';
  }

  const newTeamMember: NewTeamMember = {
    userId: user.id,
    teamId,
    role: userRole
  };

  const setupTasks: Promise<unknown>[] = [
    db.insert(teamMembers).values(newTeamMember),
    linkOAuthAccount(user.id, provider, profile.id),
    logActivity(teamId, user.id, ActivityType.SIGN_UP)
  ];

  if (inviteId) {
    setupTasks.push(
      logActivity(teamId, user.id, ActivityType.ACCEPT_INVITATION)
    );
  } else {
    setupTasks.push(logActivity(teamId, user.id, ActivityType.CREATE_TEAM));
  }

  await Promise.all(setupTasks);

  return { user, team };
}

async function linkOAuthAccount(
  userId: number,
  provider: OAuthProvider,
  providerAccountId: string
) {
  await db
    .insert(oauthAccounts)
    .values({
      userId,
      provider,
      providerAccountId
    })
    .onConflictDoNothing();
}

async function logActivity(
  teamId: number,
  userId: number,
  type: ActivityType
) {
  const newActivity: NewActivityLog = {
    teamId,
    userId,
    action: type,
    ipAddress: ''
  };
  await db.insert(activityLogs).values(newActivity);
}
