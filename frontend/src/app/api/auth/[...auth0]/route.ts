import { handleAuth } from '@auth0/nextjs-auth0';

// Force dynamic route handling for auth
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const ALL = handleAuth(); 