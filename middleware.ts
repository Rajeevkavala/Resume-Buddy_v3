import { NextRequest, NextResponse } from 'next/server';

// Public routes accessible without authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  // '/access-denied', // REMOVED - no longer using whitelist-based access denial
  '/pricing', // SaaS pricing page
];

// Routes that need authentication (protected)
const PROTECTED_ROUTES = [
  '/dashboard',
  '/analysis',
  '/qa', 
  '/interview',
  '/improvement',
  '/profile',
  '/create-resume',
  '/billing', // Subscription management
  '/cover-letter', // Cover letter generator
  '/resume-library', // Phase 4: Resume library
];

// Admin-only routes
const ADMIN_ROUTES = [
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add security headers to prevent data exposure
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy to prevent unauthorized data access
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://accounts.google.com https://api.razorpay.com https://lumberjack.razorpay.com",
    "frame-src https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "worker-src 'self' blob:"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // Check for authentication cookie (new JWT auth system)
  const authCookie = request.cookies.get('rb_session');
  const isAuthenticated = !!authCookie?.value;

  // Allow public routes
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    // Redirect authenticated users away from login/signup pages
    if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
      const returnTo = request.nextUrl.searchParams.get('returnTo');
      const target = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') 
        ? returnTo 
        : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  // Check if it's a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Redirect unauthenticated users from protected routes
  if ((isProtectedRoute || isAdminRoute) && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add debug header for development
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Auth-Status', isAuthenticated ? 'authenticated' : 'unauthenticated');
  }

  // Add performance headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  
  // Add cache control for static assets (aggressive caching)
  if (pathname.includes('/static/') || pathname.includes('/_next/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }
  
  // Add cache for page routes (short cache with revalidation)
  if (!pathname.includes('/api/') && !pathname.includes('/_next/')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
    );
  }

  // Optimize for mobile
  if (request.headers.get('user-agent')?.includes('Mobile')) {
    response.headers.set('Vary', 'User-Agent');
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except API, static files, and public assets
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|public).*)',
  ],
};