import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import { NextRequest, NextResponse } from "next/server";

// Initialize Redis client (assumes REDIS_URL is set in environment)
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Initialize rate limiter: 10 requests per 15 minutes per IP
const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "vote-endpoint",
  points: 10, // Max 10 requests
  duration: 15 * 60, // 15 minutes in seconds
});

/**
 * Applies rate-limiting to voting endpoints based on client IP
 * @param request - The incoming Next.js request
 * @returns Promise resolving to null if allowed, or a 429 response if rate-limited
 */
export async function limitVoteRequest(request: NextRequest): Promise<NextResponse | null> {
  // Extract client IP from headers
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    await rateLimiter.consume(ip);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Too many requests, please try again later" },
      { status: 429 },
    );
  }
}