import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export const runtime = 'nodejs';

export default withMiddlewareAuthRequired();

export const config = {
  matcher: [
    '/dashboard/:path*',  // Protect dashboard routes
    '/api/((?!auth).)*'  // Protect API routes except auth routes
  ]
}; 