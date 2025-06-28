import { handleAuth } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';

// Force dynamic route handling for auth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Create a single handler for all methods
const handler = handleAuth();

// Export the handler directly
export const GET = handler;
export const POST = handler;

// Custom OPTIONS handler for CORS
export const OPTIONS = async (req: Request) => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Origin': 'https://carecall.club',
    },
  });
};
