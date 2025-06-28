import { handleAuth } from '@auth0/nextjs-auth0';

// Force dynamic route handling for auth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handlers = handleAuth();
export const GET = handlers.GET;
export const POST = handlers.POST;
export const OPTIONS = handlers.OPTIONS;
export const HEAD = handlers.HEAD; 