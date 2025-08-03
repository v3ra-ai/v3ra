import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { getRateLimitConfig, isWhitelisted, logRateLimitEvent, type RateLimitConfig } from './config';
import { createLogger } from '@/lib/logger';

const logger = createLogger('rate-limit');

// Initialize Redis client if URL is provided
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });
    
    redis.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis error');
    });
    
    redis.on('connect', () => {
      logger.info('Redis connected for rate limiting');
    });
  } catch (error) {
    logger.warn({ error }, 'Failed to initialize Redis, falling back to in-memory rate limiting');
    redis = null;
  }
}

// Store rate limiters by key
const rateLimiters = new Map<string, RateLimiterRedis | RateLimiterMemory>();

// Get or create a rate limiter for a specific config
function getRateLimiter(key: string, config: RateLimitConfig): RateLimiterRedis | RateLimiterMemory {
  const cached = rateLimiters.get(key);
  if (cached) return cached;

  const options = {
    keyPrefix: config.keyPrefix || key,
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration,
  };

  // Use Redis if available, otherwise fall back to memory
  const limiter = redis
    ? new RateLimiterRedis({
        storeClient: redis,
        ...options,
      })
    : new RateLimiterMemory(options);

  rateLimiters.set(key, limiter);
  return limiter;
}

// Extract identifier from request
function getIdentifier(request: NextRequest): { key: string; ip: string; userId?: string } {
  // Get IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

  // Get user ID if available
  const userId = request.headers.get('x-user-id') ?? undefined;

  // Use user ID if available, otherwise use IP
  const key = userId || ip;

  return { key, ip, userId };
}

// Main rate limiting middleware
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  customConfig?: Partial<RateLimitConfig>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { key, ip, userId } = getIdentifier(request);
      const path = new URL(request.url).pathname;

      // Check whitelist
      if (isWhitelisted(ip)) {
        return handler(request);
      }

      // Get config for this endpoint
      const config = customConfig 
        ? { ...getRateLimitConfig(path), ...customConfig }
        : getRateLimitConfig(path);

      // Get rate limiter
      const rateLimiter = getRateLimiter(path, config);

      try {
        // Consume a point
        const rateLimiterRes = await rateLimiter.consume(key);

        // Log consumption in development
        logRateLimitEvent('consumed', key, config, {
          remainingPoints: rateLimiterRes.remainingPoints,
          userId,
          ip,
          path,
        });

        // Add rate limit headers
        const response = await handler(request);
        response.headers.set('X-RateLimit-Limit', config.points.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimiterRes.remainingPoints.toString());
        response.headers.set('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

        return response;
      } catch (rateLimiterError) {
        if (rateLimiterError instanceof RateLimiterRes) {
          // Rate limit exceeded
          logRateLimitEvent('blocked', key, config, {
            userId,
            ip,
            path,
            msBeforeNext: rateLimiterError.msBeforeNext,
          });

          return NextResponse.json(
            {
              error: 'Too many requests',
              retryAfter: Math.round(rateLimiterError.msBeforeNext / 1000),
            },
            {
              status: 429,
              headers: {
                'Retry-After': Math.round(rateLimiterError.msBeforeNext / 1000).toString(),
                'X-RateLimit-Limit': config.points.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(Date.now() + rateLimiterError.msBeforeNext).toISOString(),
              },
            }
          );
        }
        
        // Other error
        throw rateLimiterError;
      }
    } catch (error) {
      // Log error but don't block the request
      logger.error({ error }, 'Rate limiting error, allowing request');
      return handler(request);
    }
  };
}

// Preset rate limiters for common use cases
export const rateLimitStrict = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, { points: 10, duration: 60 });

export const rateLimitModerate = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, { points: 30, duration: 60 });

export const rateLimitRelaxed = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withRateLimit(handler, { points: 60, duration: 60 });

// Utility to reset rate limit for a key (useful for testing)
export async function resetRateLimit(key: string, path: string): Promise<void> {
  const config = getRateLimitConfig(path);
  const rateLimiter = getRateLimiter(path, config);
  
  try {
    await rateLimiter.delete(key);
    logRateLimitEvent('reset', key, config, { path });
  } catch (error) {
    logger.error({ error, key, path }, 'Failed to reset rate limit');
  }
}

// Cleanup function
export async function cleanup(): Promise<void> {
  if (redis) {
    await redis.quit();
  }
  rateLimiters.clear();
}