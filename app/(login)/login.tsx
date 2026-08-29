'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, Label, Spinner } from '@heroui/react';
import { buttonVariants } from '@heroui/styles';
import { CircleIcon } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const error = searchParams.get('error');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-accent" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold">
          {mode === 'signin'
            ? 'Sign in to your account'
            : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />
          <div>
            <Label htmlFor="email" className="mb-2">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.email}
              required
              maxLength={50}
              fullWidth
              placeholder="Enter your email"
            />
          </div>

          <div>
            <Label htmlFor="password" className="mb-2">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === 'signin' ? 'current-password' : 'new-password'
              }
              defaultValue={state.password}
              required
              minLength={8}
              maxLength={100}
              fullWidth
              placeholder="Enter your password"
            />
          </div>

          {(state?.error || error === 'oauth') && (
            <div className="text-danger text-sm">
              {state?.error ||
                'OAuth sign-in failed. Please try again or use email sign-in.'}
            </div>
          )}

          <div>
            <Button
              type="submit"
              fullWidth
              isDisabled={pending}
              className="py-2"
            >
              {pending ? (
                <>
                  <Spinner color="current" size="sm" className="mr-2" />
                  Loading...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Sign up'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted">
                {mode === 'signin'
                  ? 'New to our platform?'
                  : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                redirect ? `?redirect=${redirect}` : ''
              }${priceId ? `&priceId=${priceId}` : ''}`}
              className={buttonVariants({
                variant: 'outline',
                fullWidth: true
              })}
            >
              {mode === 'signin'
                ? 'Create an account'
                : 'Sign in to existing account'}
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            <OAuthLink
              provider="google"
              redirect={redirect}
              priceId={priceId}
              inviteId={inviteId}
            >
              Continue with Google
            </OAuthLink>
            <OAuthLink
              provider="facebook"
              redirect={redirect}
              priceId={priceId}
              inviteId={inviteId}
            >
              Continue with Facebook
            </OAuthLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function OAuthLink({
  provider,
  redirect,
  priceId,
  inviteId,
  children
}: {
  provider: 'google' | 'facebook';
  redirect: string | null;
  priceId: string | null;
  inviteId: string | null;
  children: React.ReactNode;
}) {
  const params = new URLSearchParams();

  if (redirect) {
    params.set('redirect', redirect);
  }

  if (priceId) {
    params.set('priceId', priceId);
  }

  if (inviteId) {
    params.set('inviteId', inviteId);
  }

  const query = params.toString();

  return (
    <Link
      href={`/api/auth/${provider}${query ? `?${query}` : ''}`}
      className={buttonVariants({
        variant: 'secondary',
        fullWidth: true
      })}
    >
      {children}
    </Link>
  );
}
