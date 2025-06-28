import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from '@auth0/nextjs-auth0';

// Force rebuild - Ensure environment variables are loaded
export const runtime = 'nodejs';

if (!process.env.AUTH0_SECRET) {
  throw new Error('AUTH0_SECRET is not defined');
}

if (!process.env.AUTH0_BASE_URL) {
  throw new Error('AUTH0_BASE_URL is not defined');
}

if (!process.env.AUTH0_ISSUER_BASE_URL) {
  throw new Error('AUTH0_ISSUER_BASE_URL is not defined');
}

if (!process.env.AUTH0_CLIENT_ID) {
  throw new Error('AUTH0_CLIENT_ID is not defined');
}

if (!process.env.AUTH0_CLIENT_SECRET) {
  throw new Error('AUTH0_CLIENT_SECRET is not defined');
}

export const GET = handleAuth({
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

export const POST = handleAuth(); 