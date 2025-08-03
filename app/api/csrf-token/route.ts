import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitRelaxed } from "@/lib/middleware/rate-limit";
import { CSRF_CONFIG, generateCSRFToken } from "@/lib/config/csrf";
import { createLogger } from "@/lib/logger";

const logger = createLogger('csrf-token');

export const GET = rateLimitRelaxed(async (request: NextRequest) => {
  try {
    // Log request headers in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('CSRF request headers', {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        host: request.headers.get('host'),
        'x-forwarded-host': request.headers.get('x-forwarded-host')
      });
    }
    
    // Verify origin to prevent CSRF token theft
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // In development or for same-origin requests, we might not have origin header
    // Same-origin requests from the browser often don't include the origin header
    // This is expected behavior, so we should allow it
    const host = request.headers.get('host');
    const isLocalRequest = host && (host.includes('localhost') || host.includes('127.0.0.1'));
    
    if (!origin && !referer && !isLocalRequest) {
      return NextResponse.json({ error: "Missing origin or referer header" }, { status: 403 });
    }
    
    // Check if origin is allowed (if provided)
    if (origin && !isLocalRequest) {
      const isAllowedOrigin = CSRF_CONFIG.allowedOrigins.some(allowed => 
        origin === allowed || origin.startsWith(allowed)
      );
      
      if (!isAllowedOrigin) {
        logger.error('Invalid origin', { origin });
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    } else if (referer && !isLocalRequest) {
      // If no origin, check referer
      const isAllowedReferer = CSRF_CONFIG.allowedOrigins.some(allowed => 
        referer.startsWith(allowed)
      );
      
      if (!isAllowedReferer) {
        logger.error('Invalid referer', { referer });
        return NextResponse.json({ error: "Invalid referer" }, { status: 403 });
      }
    }
    // Generate CSRF token using centralized function
    const csrfToken = generateCSRFToken();
    
    // Create response with token (include legacy 'token' field for compatibility)
    const responseOrigin = origin || (isLocalRequest ? `http://${host}` : CSRF_CONFIG.allowedOrigins[0]);
    const response = NextResponse.json({ csrfToken, token: csrfToken }, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Credentials': 'true',
      }
    });
    
    // Set cookie using centralized config
    response.cookies.set(CSRF_CONFIG.cookie.name, csrfToken, CSRF_CONFIG.cookie);
    
    return response;
  } catch (error) {
    logger.error("Error generating CSRF token:", error);
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 });
  }
});