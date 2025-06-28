import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export default async function middleware(req: NextRequest) {
  // Handle www to non-www redirect
  const url = req.nextUrl.clone();
  if (url.hostname === 'www.carecall.club') {
    url.hostname = 'carecall.club';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|favicon.ico).*)',
  ]
}; 