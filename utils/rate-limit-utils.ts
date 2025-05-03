import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client only in production or if explicitly enabled
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redis: Redis | null = null;
let rateLimiter: RateLimiterRedis | null = null;

if (process.env.NODE_ENV === 'production' || process.env.ENABLE_REDIS === 'true') {
  try {
    redis = new Redis(redisUrl, {
      connectTimeout: 1000, // Short timeout to fail fast
      maxRetriesPerRequest: 0, // Disable retries
      enableOfflineQueue: false, // Prevent queuing
    });

    redis.on('error', (error) => {
      console.warn('[ioredis] Connection error:', error.message);
      redis = null;
      rateLimiter = null; // Disable rate limiter if Redis fails
    });

    rateLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'vote-endpoint',
      points: 10, // Max 10 requests
      duration: 15 * 60, // 15 minutes in seconds
    });
  } catch (error) {
    console.warn('[ioredis] Failed to initialize:', (error as Error).message);
    redis = null;
    rateLimiter = null;
  }
}

/**
 * Applies rate-limiting to voting endpoints based on client IP
 * @param request - The incoming Next.js request
 * @returns Promise resolving to null if allowed, or a 429 response if rate-limited
 */
export async function limitVoteRequest(request: NextRequest): Promise<NextResponse | null> {
  // If rate limiter is unavailable, allow requests (non-production fallback)
  if (!rateLimiter) {
    console.warn('Rate limiter unavailable, allowing request');
    return null;
  }

  // Extract client IP from headers
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    await rateLimiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429 },
    );
  }
}