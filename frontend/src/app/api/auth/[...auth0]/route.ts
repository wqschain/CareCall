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

// Create a single instance of the auth handler
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

// Handle all HTTP methods
async function handler(
  req: Request,
) {
  try {
    // Log the request URL and method for debugging
    console.log('Auth request:', {
      url: req.url,
      method: req.method,
    });

    // Pass the request to the auth handler
    const res = await auth0Handler(req);
    
    // If no response, return a 404
    if (!res) {
      console.error('No response from auth handler');
      return NextResponse.json(
        { error: 'Not Found' },
        { status: 404 }
      );
    }

    return res;
  } catch (error) {
    // Log the full error for debugging
    console.error('Auth error:', error);
    
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler; 