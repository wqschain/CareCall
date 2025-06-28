import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from '@auth0/nextjs-auth0';

// Force rebuild - Environment variables are loaded at runtime
export const runtime = 'nodejs';

// Create the handler dynamically to avoid build-time execution
const createHandler = () => {
  // Log environment state
  console.log('Auth0 Environment Check:', {
    hasSecret: !!process.env.AUTH0_SECRET,
    hasBaseUrl: !!process.env.AUTH0_BASE_URL,
    hasIssuerUrl: !!process.env.AUTH0_ISSUER_BASE_URL,
    hasClientId: !!process.env.AUTH0_CLIENT_ID,
    hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
  
  return handleAuth({
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
};

// Export dynamic route handlers
export const GET = createHandler;
export const POST = createHandler; 