// Re-export from new rate limiting system for backward compatibility
export { 
  withRateLimit,
  rateLimitStrict,
  rateLimitModerate,
  rateLimitRelaxed,
  resetRateLimit
} from '@/lib/rate-limit/index';

// Legacy support for old imports
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit as newWithRateLimit } from '@/lib/rate-limit/index';

// Map old tier names to new configs
const tierToConfig = {
  strict: { points: 10, duration: 60 },
  normal: { points: 30, duration: 60 },
  relaxed: { points: 60, duration: 60 },
  auth: { points: 5, duration: 900 },
  vote: { points: 30, duration: 60 },
};

export type RateLimitTier = keyof typeof tierToConfig;

/**
 * Legacy rate limiting middleware (deprecated)
 * @deprecated Use rateLimitStrict, rateLimitModerate, or rateLimitRelaxed instead
 */
export function withRateLimitLegacy(
  tier: RateLimitTier,
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  const config = tierToConfig[tier];
  return newWithRateLimit(handler, config);
}

// Legacy convenience functions for old tier names
export const rateLimitAuth = (handler: (req: NextRequest) => Promise<NextResponse>) => 
  withRateLimitLegacy('auth', handler);

export const rateLimitVote = (handler: (req: NextRequest) => Promise<NextResponse>) => 
  withRateLimitLegacy('vote', handler);

export const rateLimitNormal = (handler: (req: NextRequest) => Promise<NextResponse>) => 
  withRateLimitLegacy('normal', handler);