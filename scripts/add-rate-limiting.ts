/**
 * Script to add rate limiting to API routes
 * This maps out which rate limit tier should be applied to each route
 */

export const RATE_LIMIT_CONFIG = {
  // Strict rate limiting (5 req/min) - expensive operations
  strict: [
    '/api/broadcast-query',
    '/api/truth-market-v2',
    '/api/headlines/daily',
    '/api/dev/mock-points',
  ],
  
  // Auth rate limiting (10 req/15min) - authentication endpoints
  auth: [
    '/api/auth/create-user',
    '/api/auth/session',
  ],
  
  // Normal rate limiting (30 req/min) - standard mutations
  normal: [
    '/api/user/daily-bonus',
    '/api/user/custom-llms',
    '/api/feedback',
    '/api/predictions/*/bet',
    '/api/user/predictions',
    '/api/headlines/resolve',
  ],
  
  // Relaxed rate limiting (100 req/min) - read operations
  relaxed: [
    '/api/user/points',
    '/api/validators/active',
    '/api/validators/llm',
    '/api/validators/registry',
    '/api/validators/reliability',
    '/api/predictions',
    '/api/predictions/metrics',
    '/api/leaderboard/users',
    '/api/vote-session/*',
    '/api/csrf-token',
  ],
};

// Routes that should skip rate limiting
export const SKIP_RATE_LIMIT = [
  '/api/cron/check-predictions', // Uses secret-based auth
];

/**
 * Example of how to apply rate limiting to a route:
 * 
 * import { rateLimitNormal } from "@/lib/middleware/rate-limit";
 * 
 * export const POST = rateLimitNormal(async (request: NextRequest) => {
 *   // existing route logic
 * });
 */