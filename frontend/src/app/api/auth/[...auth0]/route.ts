import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from '@auth0/nextjs-auth0';

// Force rebuild - Environment variables are loaded at runtime
export const runtime = 'nodejs';

// Create the handler dynamically to avoid build-time execution
const createHandler = () => {
  // Runtime check for environment variables
  if (typeof process.env.AUTH0_SECRET === 'undefined') {
    throw new Error('AUTH0_SECRET is not defined');
  }
  
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