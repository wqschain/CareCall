import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  // Don't redirect if already on login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    console.log('[DEBUG] No auth token found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Get JWT_SECRET from environment
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      console.error('[DEBUG] JWT_SECRET not found in environment')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify the token
    await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    )
    
    console.log('[DEBUG] Token verified successfully')
    return NextResponse.next()
  } catch (error) {
    // If token is invalid, redirect to login
    console.error('[DEBUG] Token verification failed:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/recipients/:path*",
    "/api/checkins/:path*"
  ]
} 