import { handleAuth } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

// Force dynamic route handling for auth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Log environment state
const envCheck = {
  hasSecret: !!process.env.AUTH0_SECRET,
  hasBaseUrl: !!process.env.AUTH0_BASE_URL,
  hasIssuerUrl: !!process.env.AUTH0_ISSUER_BASE_URL,
  hasClientId: !!process.env.AUTH0_CLIENT_ID,
  hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET,
  nodeEnv: process.env.NODE_ENV,
};

console.log('Auth0 Environment Check:', envCheck);

// If any required env vars are missing, throw an error
if (!Object.values(envCheck).slice(0, -1).every(Boolean)) {
  throw new Error('Missing required Auth0 environment variables');
}

// Initialize handlers at module level
const handlers = handleAuth();
export const GET = handlers.GET;
export const POST = handlers.POST; 