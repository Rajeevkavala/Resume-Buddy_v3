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
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com https://apis.google.com https://www.googleapis.com https://accounts.google.com https://checkout.razorpay.com https://api.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob: https://*.supabase.co https://hlduevifufaasxmrtjks.supabase.co",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.firebase.com wss://*.firebase.com https://accounts.google.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.supabase.co https://hlduevifufaasxmrtjks.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com",
    "frame-src https://accounts.google.com https://*.firebaseapp.com https://*.firebase.com https://checkout.razorpay.com https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "worker-src 'self' blob:"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // Check for authentication cookie
  // New auth system uses rb_session, legacy system used fast-auth-uid
  const newAuthCookie = request.cookies.get('rb_session');
  const legacyAuthCookie = request.cookies.get('fast-auth-uid');
  const isAuthenticated = !!(newAuthCookie?.value || legacyAuthCookie?.value);

  // Allow public routes
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  if (isPublicRoute) {
    // Don't redirect authenticated users from login/signup during sign-in flow
    // The page will handle the redirect after successful authentication
    // Only redirect if user directly visits login/signup when already authenticated
    // and there's no returnTo parameter (which indicates sign-in in progress)
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