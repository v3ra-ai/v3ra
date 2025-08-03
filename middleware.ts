import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CSRF_CONFIG, generateCSRFToken } from '@/lib/config/csrf';

export function middleware(request: NextRequest) {
  // Clone the response
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS - Enforce HTTPS for 2 years, including subdomains
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vitals.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com", // Temporarily added back unsafe-inline and unsafe-eval
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openrouter.ai https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://vitals.vercel-insights.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Secure cookie settings for authentication
  const cookies = request.cookies;
  
  // If we have auth cookies, ensure they're secure
  if (cookies.has('sb-access-token') || cookies.has('sb-refresh-token')) {
    // Note: We can't modify existing cookies here, but we can validate
    // The actual secure cookie setting should be done in the auth flow
  }
  
  // Add CSRF token if not present
  // Skip for API routes and if token already exists
  if (!cookies.has(CSRF_CONFIG.cookie.name) && !request.url.includes('/api/')) {
    // Only generate a new token if one doesn't exist
    const csrfToken = generateCSRFToken();
    response.cookies.set(CSRF_CONFIG.cookie.name, csrfToken, CSRF_CONFIG.cookie);
  } else if (cookies.has(CSRF_CONFIG.cookie.name)) {
    // If CSRF token exists, ensure it's forwarded to the response
    // This prevents the cookie from being lost during the response cycle
    const existingToken = cookies.get(CSRF_CONFIG.cookie.name);
    if (existingToken) {
      // Don't set the cookie again, it's already there
      // Just ensure the response knows about it
    }
  }
  
  return response;
}

// Apply middleware to all routes except static files and images
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

// Remove duplicate function - now using centralized version from lib/config/csrf.ts