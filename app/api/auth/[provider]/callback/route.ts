import { NextRequest, NextResponse } from 'next/server';
import { handleOAuthCallback, isOAuthProvider } from '@/lib/auth/oauth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return handleOAuthCallback(request, provider);
}
