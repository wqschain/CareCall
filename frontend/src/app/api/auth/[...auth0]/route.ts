import { handleAuth } from '@auth0/nextjs-auth0';
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

// Create a basic handler with no configuration
const auth0Handler = handleAuth();

// Simple handler function that just passes through to Auth0
async function handler(req: Request) {
  try {
    // Log request details
    console.log('Auth request:', {
      url: req.url,
      method: req.method,
      pathname: new URL(req.url).pathname
    });

    // Let Auth0 handle everything
    return await auth0Handler(req);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Export the handler for both GET and POST
export const GET = handler;
export const POST = handler; 