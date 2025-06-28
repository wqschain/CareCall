import { handleAuth } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

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

// Export the GET and POST handlers directly from handleAuth()
export const { GET, POST } = handleAuth(); 