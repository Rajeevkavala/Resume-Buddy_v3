'use client';

import dynamic from 'next/dynamic';
import { ReactNode, Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Import critical components statically for faster initial rendering
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import { ResumeProvider } from '@/context/resume-context';
import { SubscriptionProvider } from '@/context/subscription-context';
import { useAuth } from '@/context/auth-context';
import { PrivacyGuard } from '@/components/privacy-guard';

// Import Navbar statically to avoid skeleton loading
import Navbar from '@/components/navbar';

// Dynamically import non-critical components
const Toaster = dynamic(() => import('@/components/ui/sonner').then(mod => ({ default: mod.Toaster })), {
  ssr: false,
});
const ClientServiceWorker = dynamic(() => import('./client-service-worker'), {
  ssr: false,
});
const UpdatePrompt = dynamic(() => import('@/components/update-prompt').then(mod => ({ default: mod.UpdatePrompt })), {
  ssr: false,
});

interface ClientLayoutProps {
  children: ReactNode;
}

// Protected routes that require whitelist access
const PROTECTED_ROUTES = [
  '/dashboard',
  '/analysis',
  '/qa', 
  '/interview',
  '/improvement',
  '/profile',
  '/create-resume',
  '/admin',
];

const RESUME_DATA_ROUTES = [
  '/dashboard',
  '/analysis',
  '/qa',
  '/interview',
  '/improvement',
  '/create-resume',
  '/resume-library',
  '/cover-letter',
];

const PREFETCH_ROUTES_AUTH = [
  '/dashboard',
  '/analysis',
  '/qa',
  '/interview',
  '/improvement',
  '/create-resume',
  '/resume-library',
  '/billing',
  '/profile',
];

const PREFETCH_ROUTES_PUBLIC = ['/', '/login', '/signup', '/pricing'];

// Component to handle conditional layout rendering
function ConditionalLayoutWrapper({ children }: { children: ReactNode }) {
  const { user, isAllowed, loading, accessDeniedReason } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Pages that don't need navbar wrapper
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/access-denied';
  
  // Admin pages have their own layout (sidebar), no main app navbar
  const isAdminPage = pathname.startsWith('/admin');
  
  // Check if current page is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Client-side protection: redirect blocked users away from protected routes
  useEffect(() => {
    if (!loading && user && !isAllowed && isProtectedRoute) {
      console.log('🚫 Client-side redirect: User not allowed on protected route');
      router.replace('/access-denied?reason=' + encodeURIComponent(accessDeniedReason || 'Access denied'));
    }
  }, [loading, user, isAllowed, isProtectedRoute, router, accessDeniedReason]);

  // Prefetch common destinations to make navigation feel instant
  useEffect(() => {
    if (loading) return;

    const targets = user ? PREFETCH_ROUTES_AUTH : PREFETCH_ROUTES_PUBLIC;
    for (const route of targets) {
      router.prefetch(route);
    }
  }, [loading, user, router]);
  
  // If user is blocked and trying to access protected route, show nothing while redirecting
  if (!loading && user && !isAllowed && isProtectedRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  // Show content without navbar for public pages, unauthenticated users, or admin pages
  if (isPublicPage || !user || isAdminPage) {
    return <>{children}</>;
  }
  
  // Authenticated pages get navbar layout
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

function RouteScopedProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const needsResumeContext = RESUME_DATA_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (needsResumeContext) {
    return <ResumeProvider>{children}</ResumeProvider>;
  }

  return <>{children}</>;
}

// Dynamically import WebVitals for performance monitoring
const WebVitals = dynamic(() => import('@/components/web-vitals').then(mod => ({ default: mod.WebVitals })), {
  ssr: false,
});

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <PrivacyGuard>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      > 
        <Suspense fallback={null}>
          <AuthProvider>
            <SubscriptionProvider>
              <RouteScopedProviders>
                <ConditionalLayoutWrapper>
                  {children}
                </ConditionalLayoutWrapper>
                <Toaster richColors />
                <ClientServiceWorker />
                <UpdatePrompt />
                <WebVitals />
              </RouteScopedProviders>
            </SubscriptionProvider>
          </AuthProvider>
        </Suspense>
      </ThemeProvider>
    </PrivacyGuard>
  );
}