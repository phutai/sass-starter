import { NextRequest, NextResponse } from 'next/server';
import {
  isOAuthProvider,
  redirectToOAuthProvider
} from '@/lib/auth/oauth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  if (!isOAuthProvider(provider)) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  try {
    return await redirectToOAuthProvider(request, provider);
  } catch (error) {
    console.error('OAuth start failed:', error);
    return NextResponse.redirect(new URL('/sign-in?error=oauth', request.url));
  }
}
