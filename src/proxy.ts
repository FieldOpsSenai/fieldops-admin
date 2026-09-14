import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login'];

// Next.js 16+ requires the function to be named "proxy" (previously "middleware")
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes to pass through
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for the auth token cookie set by sessionStore.ts after login
  const token = request.cookies.get('fieldops_auth')?.value;

  if (!token) {
    // Redirect to login, preserving the intended destination
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Apply to all routes except static files and _next internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
