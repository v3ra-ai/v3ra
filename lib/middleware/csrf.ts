import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, ErrorCode } from '@/lib/utils/api-errors';
import { CSRF_CONFIG } from '@/lib/config/csrf';

/**
 * Validates CSRF token for state-changing requests
 */
export async function validateCSRF(request: NextRequest): Promise<void> {
  // Skip CSRF check for safe methods
  if (CSRF_CONFIG.safeMethods.includes(request.method as any)) {
    return;
  }

  // Validate Origin header
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Allow same-origin requests (no Origin/Referer) if valid CSRF tokens match
  const headerTokenEarly = request.headers.get(CSRF_CONFIG.headerName);
  const cookieTokenEarly = request.cookies.get(CSRF_CONFIG.cookie.name)?.value;
  if (!origin && !referer && headerTokenEarly && cookieTokenEarly && headerTokenEarly === cookieTokenEarly) {
    return;
  }
  
  // For state-changing requests, we must have an origin or referer
  if (!origin && !referer) {
    throw new Error('Missing origin or referer header');
  }
  
  // Check if origin is allowed
  if (origin) {
    const isAllowedOrigin = CSRF_CONFIG.allowedOrigins.some(allowed => 
      origin === allowed || origin.startsWith(allowed)
    );
    
    // Also allow Vercel preview URLs
    const isVercelPreview = origin.includes('.vercel.app');
    
    if (!isAllowedOrigin && !isVercelPreview) {
      throw new Error(`Invalid origin: ${origin}`);
    }
  }
  
  // If no origin, check referer
  if (!origin && referer) {
    const isAllowedReferer = CSRF_CONFIG.allowedOrigins.some(allowed => 
      referer.startsWith(allowed)
    );
    
    if (!isAllowedReferer) {
      throw new Error(`Invalid referer: ${referer}`);
    }
  }

  // Get CSRF token from header
  const headerToken = request.headers.get(CSRF_CONFIG.headerName);
  
  // Get CSRF token from cookie
  const cookieToken = request.cookies.get(CSRF_CONFIG.cookie.name)?.value;
  
  // Validate tokens exist and match
  if (!headerToken) {
    throw new Error('Missing CSRF token in header');
  }
  if (!cookieToken) {
    throw new Error('Missing CSRF token in cookie');
  }
  if (headerToken !== cookieToken) {
    throw new Error('CSRF token mismatch');
  }
}

/**
 * CSRF protection middleware wrapper
 */
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      await validateCSRF(request);
      return handler(request);
    } catch (error) {
      if (error instanceof Error && error.message.includes('CSRF')) {
        return createErrorResponse(
          error.message, // Return the specific CSRF error
          ErrorCode.INVALID_TOKEN,
          403
        );
      }
      if (error instanceof Error && (error.message.includes('origin') || error.message.includes('referer'))) {
        return createErrorResponse(
          error.message,
          ErrorCode.INVALID_TOKEN,
          403
        );
      }
      throw error;
    }
  };
}