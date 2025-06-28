'use client';

import { handleAuth, handleLogout } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';

export const dynamic = 'force-dynamic';

export const GET = handleAuth({
  logout: handleLogout({ returnTo: process.env.AUTH0_BASE_URL })
}); 