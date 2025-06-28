import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

// Force dynamic route handling for auth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Log environment state
console.log('Auth0 Environment Check:', {
  hasSecret: !!process.env.AUTH0_SECRET,
  hasBaseUrl: !!process.env.AUTH0_BASE_URL,
  hasIssuerUrl: !!process.env.AUTH0_ISSUER_BASE_URL,
  hasClientId: !!process.env.AUTH0_CLIENT_ID,
  hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
  nodeEnv: process.env.NODE_ENV,
});

const auth0Handler = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard',
    authorizationParams: {
      prompt: 'login',
      response_type: 'code',
      scope: 'openid profile email',
    },
  }),
  callback: handleCallback({
    afterCallback: (_req: NextApiRequest, _res: NextApiResponse, session: Session) => {
      return session;
    },
  }),
  logout: handleLogout({
    returnTo: '/',
  }),
});

export async function GET(
  req: Request,
  context: { params: { auth0: string[] } }
) {
  try {
    const res = await auth0Handler(req);
    return res;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const POST = GET; 