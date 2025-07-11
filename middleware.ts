import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/api/user/points',
  '/api/user/daily-bonus',
  '/api/user/custom-llms',
  '/api/user/predictions',
  '/api/predictions/*/bet',
  '/api/feedback',
  '/api/truth-market-v2',
  '/api/broadcast-query',
];

// Define admin-only routes
const ADMIN_ROUTES = [
  '/api/dev/',
  '/api/headlines/resolve',
];

// Define routes that should validate CSRF tokens
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    // Skip middleware for static assets and Next.js internals
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // Clone the request headers
    const requestHeaders = new Headers(request.headers);
    
    // Check if route requires authentication
    const requiresAuth = PROTECTED_ROUTES.some(route => {
      if (route.includes('*')) {
        const pattern = new RegExp(route.replace('*', '.*'));
        return pattern.test(pathname);
      }
      return pathname.startsWith(route);
    });

    const requiresAdmin = ADMIN_ROUTES.some(route => pathname.startsWith(route));

    // Handle authentication for protected routes
    if (requiresAuth || requiresAdmin) {
      try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Check admin access
        if (requiresAdmin) {
          const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
          if (!user.email || !adminEmails.includes(user.email)) {
            return NextResponse.json(
              { error: 'Admin access required' },
              { status: 403 }
            );
          }
        }

        // Add user ID to headers for downstream use
        requestHeaders.set('x-user-id', user.id);
        requestHeaders.set('x-user-email', user.email || '');
      } catch (error) {
        console.error('Auth check failed:', error);
        return NextResponse.json(
          { error: 'Authentication check failed' },
          { status: 500 }
        );
      }
    }

    // CSRF Protection for state-changing requests
    if (pathname.startsWith('/api/') && CSRF_PROTECTED_METHODS.includes(method)) {
      const csrfToken = request.headers.get('X-CSRF-Token');
      const cookieToken = request.cookies.get('csrf-token')?.value;

      // Skip CSRF check for certain endpoints (e.g., webhooks)
      const skipCSRF = ['/api/cron/', '/api/headlines/resolve'].some(path => pathname.startsWith(path));

      if (!skipCSRF && (!csrfToken || csrfToken !== cookieToken)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        );
      }
    }
    
    // Create response
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.newrelic.com https://*.nr-data.net https://*.hotjar.com https://*.sentry.io https://www.googletagmanager.com https://www.google-analytics.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.newrelic.com https://*.nr-data.net https://*.hotjar.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://openrouter.ai https://www.google-analytics.com; " +
    "worker-src 'self' blob:;"
  );
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || '*';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};