/**
 * Centralized CSRF configuration
 */

// Rate limit configurations for different endpoint types
export const RATE_LIMITS = {
  write: {
    points: 20,
    duration: 60, // 20 requests per minute for write operations
  },
  read: {
    points: 60,
    duration: 60, // 60 requests per minute for read operations
  },
  auth: {
    points: 5,
    duration: 15 * 60, // 5 requests per 15 minutes for auth
  },
} as const;

export const CSRF_CONFIG = {
  // Cookie settings
  cookie: {
    name: 'csrf-token',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const, // Changed from 'strict' to 'lax' to allow cookies on navigation
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  },
  
  // Header name (must be lowercase for Next.js)
  headerName: 'x-csrf-token',
  
  // Safe HTTP methods that don't require CSRF
  safeMethods: ['GET', 'HEAD', 'OPTIONS'],
  
  // Allowed origins
  allowedOrigins: [
    'https://v3ra.app',
    'https://www.v3ra.app',
    'https://v3ra.ai',
    'https://www.v3ra.ai',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null,
    process.env.NEXT_PUBLIC_SITE_URL,
    // Add Vercel preview URLs
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean) as string[],
} as const;

/**
 * Generate a cryptographically secure CSRF token
 * Uses Web Crypto API which is available in both browser and Edge Runtime
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}