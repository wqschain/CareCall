import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard',
    authorizationParams: {
      prompt: 'login',
    },
    getLoginState: (req: NextRequest) => {
      // Force non-www domain for callback
      const baseUrl = process.env.AUTH0_BASE_URL || 'https://carecall.club';
      return {
        returnTo: '/dashboard',
        callbackUrl: `${baseUrl}/api/auth/callback`
      };
    }
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

export const POST = handleAuth({
  callback: handleCallback({
    afterCallback: (_req: NextApiRequest, _res: NextApiResponse, session: Session) => {
      return session;
    },
  }),
}); 