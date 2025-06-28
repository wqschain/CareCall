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

// Create the auth handler with configuration
const handler = handleAuth({
  async callback(req: Request) {
    try {
      // Get the URL from the request
      const url = new URL(req.url);
      console.log('Callback URL:', url.toString());
      
      // Let Auth0 handle the callback
      const response = await handleAuth()(req);
      return response;
    } catch (error) {
      console.error('Callback error:', error);
      return NextResponse.json(
        { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }
});

// Export the handler for both GET and POST methods
export async function GET(req: Request) {
  try {
    console.log('Auth request:', {
      url: req.url,
      method: req.method,
      pathname: new URL(req.url).pathname
    });

    const response = await handler(req);
    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle POST requests the same way
export const POST = GET; 