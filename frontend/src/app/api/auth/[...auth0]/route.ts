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

// Create the auth handler
const handler = handleAuth();

// Export a single handler for all HTTP methods
export async function GET(req: NextRequest) {
  try {
    // Log request details for debugging
    console.log('Auth request:', {
      url: req.url,
      method: req.method,
      pathname: new URL(req.url).pathname
    });

    // Let Auth0 handle everything
    return await handler(req);
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// Handle POST requests the same way
export const POST = GET; 