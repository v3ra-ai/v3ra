import { createLogger } from '@/lib/logger';

const logger = createLogger('rate-limit');

export interface RateLimitConfig {
  // Requests per window
  points: number;
  // Window duration in seconds
  duration: number;
  // Block duration in seconds when limit exceeded
  blockDuration?: number;
  // Custom key prefix
  keyPrefix?: string;
  // Skip rate limiting for these IPs/users
  skipList?: string[];
}

// Rate limit configurations for different endpoints
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Strict limits for sensitive operations
  'auth:login': {
    points: 5,
    duration: 15 * 60, // 15 minutes
    blockDuration: 15 * 60, // Block for 15 minutes
  },
  'auth:signup': {
    points: 3,
    duration: 60 * 60, // 1 hour
    blockDuration: 60 * 60, // Block for 1 hour
  },
  'auth:password-reset': {
    points: 3,
    duration: 60 * 60, // 1 hour
    blockDuration: 60 * 60,
  },

  // Moderate limits for write operations
  'api:vote': {
    points: 20,
    duration: 60, // 20 votes per minute
    blockDuration: 5 * 60, // Block for 5 minutes
  },
  'api:feedback': {
    points: 10,
    duration: 60 * 60, // 10 feedback per hour
    blockDuration: 60 * 60,
  },
  'api:username-update': {
    points: 3,
    duration: 24 * 60 * 60, // 3 changes per day
    blockDuration: 60 * 60,
  },
  'api:profile-update': {
    points: 20,
    duration: 60, // 20 updates per minute
    blockDuration: 5 * 60,
  },

  // Relaxed limits for read operations
  'api:points': {
    points: 60,
    duration: 60, // 60 requests per minute
    blockDuration: 60,
  },
  'api:leaderboard': {
    points: 30,
    duration: 60, // 30 requests per minute
    blockDuration: 60,
  },
  'api:analytics': {
    points: 20,
    duration: 60, // 20 requests per minute
    blockDuration: 60,
  },

  // Very relaxed for health checks
  'api:health': {
    points: 300,
    duration: 60, // 300 requests per minute
    blockDuration: 60,
  },

  // Global rate limit (fallback)
  'global': {
    points: 100,
    duration: 60, // 100 requests per minute per IP
    blockDuration: 5 * 60,
  },
};

// Get rate limit config for a path
export function getRateLimitConfig(path: string): RateLimitConfig {
  // Try exact match first
  const exactMatch = Object.entries(rateLimitConfigs).find(([key]) => 
    path.includes(key.replace(':', '/'))
  );
  
  if (exactMatch) {
    return exactMatch[1];
  }

  // Try category match
  if (path.includes('/api/auth/')) {
    return rateLimitConfigs['auth:login'];
  }
  
  if (path.includes('/api/')) {
    // Default API rate limit
    return rateLimitConfigs['api:points'];
  }

  // Global fallback
  return rateLimitConfigs['global'];
}

// Check if IP is whitelisted
export function isWhitelisted(ip: string): boolean {
  const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
  return whitelist.includes(ip);
}

// Log rate limit events
export function logRateLimitEvent(
  event: 'consumed' | 'blocked' | 'reset',
  key: string,
  config: RateLimitConfig,
  metadata?: Record<string, any>
) {
  if (event === 'blocked') {
    logger.warn('Rate limit exceeded', {
      event,
      key,
      config,
      ...metadata
    });
  } else if (process.env.NODE_ENV === 'development') {
    logger.debug('Rate limit event', {
      event,
      key,
      config,
      ...metadata
    });
  }
}