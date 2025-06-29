import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login/email', '/api/auth/verify'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for auth token in cookie
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    console.log('[Auth] No token found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify JWT token
    const verified = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    // For API routes, add the Authorization header
    const requestHeaders = new Headers(request.headers);
    if (request.nextUrl.pathname.startsWith('/api/')) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
    requestHeaders.set('x-user-email', verified.payload.sub as string);

    // Return the response with modified headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    
    // Clear the invalid token and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    
    return response;
  }
}

// Update matcher to protect all routes except public ones
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/login/email, /api/auth/verify (auth endpoints)
     * 2. /login (login page)
     * 3. /_next (Next.js internals)
     * 4. /static (static files)
     * 5. /favicon.ico, /robots.txt (static files)
     */
    '/((?!api/auth/login/email|api/auth/verify|login|_next|static|favicon.ico|robots.txt).*)',
  ],
} 