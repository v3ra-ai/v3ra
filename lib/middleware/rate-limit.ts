import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';
import { ErrorCode, createErrorResponse } from '@/lib/utils/api-errors';

// Different rate limiters for different endpoints
const rateLimiters = {
  // Strict limit for expensive operations
  strict: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    tokensPerInterval: 5,
  }),
  // Normal limit for regular API calls
  normal: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    tokensPerInterval: 30,
  }),
  // Relaxed limit for read operations
  relaxed: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    tokensPerInterval: 100,
  }),
  // Authentication endpoints
  auth: new RateLimiter({
    interval: 15 * 60 * 1000, // 15 minutes
    tokensPerInterval: 10,
  }),
};

export type RateLimitTier = keyof typeof rateLimiters;

/**
 * Rate limiting middleware
 * @param tier - The rate limit tier to apply
 * @param handler - The handler function to execute if rate limit passes
 */
export function withRateLimit(
  tier: RateLimitTier,
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const limiter = rateLimiters[tier];
    
    // Get identifier from request
    const identifier = getIdentifier(request);
    
    try {
      await limiter.check(identifier);
    } catch (error) {
      return createErrorResponse(
        'Too many requests. Please try again later.',
        ErrorCode.RATE_LIMITED,
        429
      );
    }
    
    return handler(request);
  };
}

/**
 * Get a unique identifier for rate limiting
 * Uses user ID if authenticated, otherwise uses IP address
 */
function getIdentifier(request: NextRequest): string {
  // Check for user ID from auth middleware
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip');
  
  return `ip:${ip || 'unknown'}`;
}

/**
 * Convenience functions for common rate limit tiers
 */
export const rateLimitStrict = (handler: (req: NextRequest) => Promise<NextResponse>) => 
  withRateLimit('strict', handler);

export const rateLimitNormal = (handler: (req: NextRequest) => Promise<NextResponse>) => 
  withRateLimit('normal', handler);

export const rateLimitRelaxed = (handler: (req: NextRequest) => Promise<NextResponse>) => 
  withRateLimit('relaxed', handler);

export const rateLimitAuth = (handler: (req: NextRequest) => Promise<NextResponse>) => 
  withRateLimit('auth', handler);