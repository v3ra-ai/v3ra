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
    const xForwardedHost = request.headers.get('x-forwarded-host');
    const actualHost = xForwardedHost || host;
    
    const isLocalRequest = host && (host.includes('localhost') || host.includes('127.0.0.1'));
    const isV3raRequest = actualHost && (actualHost.includes('v3ra.ai') || actualHost.includes('v3ra.app'));
    const isVercelRequest = actualHost && actualHost.includes('.vercel.app');
    
    // For same-origin requests from our domains, we can trust them
    if (!origin && !referer && !isLocalRequest && !isV3raRequest && !isVercelRequest) {
      logger.warn('Missing origin or referer header', { host, xForwardedHost, actualHost });
      return NextResponse.json({ error: "Missing origin or referer header" }, { status: 403 });
    }
    
    // Check if origin is allowed (if provided)
    if (origin && !isLocalRequest && !isV3raRequest && !isVercelRequest) {
      const isAllowedOrigin = CSRF_CONFIG.allowedOrigins.some(allowed => 
        origin === allowed || origin.startsWith(allowed)
      ) || origin.includes('v3ra.ai') || origin.includes('v3ra.app') || origin.includes('.vercel.app');
      
      if (!isAllowedOrigin) {
        logger.error('Invalid origin', { origin, allowedOrigins: CSRF_CONFIG.allowedOrigins });
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    } else if (referer && !isLocalRequest && !isV3raRequest && !isVercelRequest) {
      // If no origin, check referer
      const isAllowedReferer = CSRF_CONFIG.allowedOrigins.some(allowed => 
        referer.startsWith(allowed)
      ) || referer.includes('v3ra.ai') || referer.includes('v3ra.app') || referer.includes('.vercel.app');
      
      if (!isAllowedReferer) {
        logger.error('Invalid referer', { referer, allowedOrigins: CSRF_CONFIG.allowedOrigins });
        return NextResponse.json({ error: "Invalid referer" }, { status: 403 });
      }
    }
    // Generate CSRF token using centralized function
    const csrfToken = generateCSRFToken();
    
    // Create response with token (include legacy 'token' field for compatibility)
    let responseOrigin = origin;
    if (!responseOrigin) {
      if (isLocalRequest) {
        responseOrigin = `http://${host}`;
      } else if (isV3raRequest || isVercelRequest) {
        responseOrigin = `https://${actualHost}`;
      } else if (referer) {
        // Extract origin from referer
        const refererUrl = new URL(referer);
        responseOrigin = refererUrl.origin;
      } else {
        responseOrigin = CSRF_CONFIG.allowedOrigins[0];
      }
    }
    
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