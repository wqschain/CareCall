import { handleAuth } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

// Force dynamic route handling for auth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handlers = handleAuth();

// Helper function to log request details
const logRequest = async (method: string, req: Request) => {
  console.log(`[Auth0 ${method}] Request received:`, {
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  });
};

// Helper function to log errors
const logError = (method: string, error: any) => {
  console.error(`[Auth0 ${method}] Error:`, {
    message: error.message,
    stack: error.stack,
    cause: error.cause,
  });
};

// Export all handlers with proper CORS headers and logging
export const GET = async (req: Request) => {
  try {
    await logRequest('GET', req);
    const response = await handlers.GET(req);
    console.log('[Auth0 GET] Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
    return response;
  } catch (error) {
    logError('GET', error);
    throw error; // Re-throw to let Auth0 handle it
  }
};

export const POST = async (req: Request) => {
  try {
    await logRequest('POST', req);
    const response = await handlers.POST(req);
    console.log('[Auth0 POST] Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
    return response;
  } catch (error) {
    logError('POST', error);
    throw error;
  }
};

export const OPTIONS = async (req: Request) => {
  try {
    await logRequest('OPTIONS', req);
    const response = new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
    console.log('[Auth0 OPTIONS] Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
    return response;
  } catch (error) {
    logError('OPTIONS', error);
    throw error;
  }
};

export const HEAD = async (req: Request) => {
  try {
    await logRequest('HEAD', req);
    const response = await handlers.HEAD(req);
    console.log('[Auth0 HEAD] Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    });
    return response;
  } catch (error) {
    logError('HEAD', error);
    throw error;
  }
}; 