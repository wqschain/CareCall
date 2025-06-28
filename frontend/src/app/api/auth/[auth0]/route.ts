import { handleAuth } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { Session } from '@auth0/nextjs-auth0';

export const GET = handleAuth(); 