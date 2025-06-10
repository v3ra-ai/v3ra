import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter for serverless environments
 * Note: This only works within a single request lifecycle on Vercel
 * For production, consider using Vercel's Edge Config or external rate limiting
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

// In-memory store (resets on each cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

// Cleanup old entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

function cleanupOldEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  const cutoff = now - WINDOW_MS;
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.firstRequest < cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Applies rate-limiting to voting endpoints based on client IP
 * @param request - The incoming Next.js request
 * @returns Promise resolving to null if allowed, or a 429 response if rate-limited
 */
export async function limitVoteRequest(request: NextRequest): Promise<NextResponse | null> {
  // Clean up old entries
  cleanupOldEntries();
  
  // Extract client IP from headers
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
  
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  if (!entry) {
    // First request from this IP
    rateLimitStore.set(ip, { count: 1, firstRequest: now });
    return null;
  }
  
  // Check if window has expired
  if (now - entry.firstRequest > WINDOW_MS) {
    // Reset the window
    rateLimitStore.set(ip, { count: 1, firstRequest: now });
    return null;
  }
  
  // Check if limit exceeded
  if (entry.count >= MAX_REQUESTS) {
    const remainingTime = Math.ceil((WINDOW_MS - (now - entry.firstRequest)) / 1000);
    return NextResponse.json(
      { 
        error: 'Too many requests, please try again later',
        retryAfter: remainingTime
      },
      { 
        status: 429,
        headers: {
          'Retry-After': remainingTime.toString()
        }
      }
    );
  }
  
  // Increment counter
  entry.count++;
  return null;
}

/**
 * Generic rate limiter for other endpoints
 * @param key - Unique identifier for rate limiting (e.g., user ID, IP)
 * @param points - Number of requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function createRateLimiter(points: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();
  let lastCleanup = Date.now();
  
  return {
    async check(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
      const now = Date.now();
      
      // Cleanup
      if (now - lastCleanup > 60000) {
        lastCleanup = now;
        const cutoff = now - windowMs;
        for (const [k, entry] of store.entries()) {
          if (entry.firstRequest < cutoff) {
            store.delete(k);
          }
        }
      }
      
      const entry = store.get(key);
      
      if (!entry) {
        store.set(key, { count: 1, firstRequest: now });
        return { allowed: true };
      }
      
      if (now - entry.firstRequest > windowMs) {
        store.set(key, { count: 1, firstRequest: now });
        return { allowed: true };
      }
      
      if (entry.count >= points) {
        const retryAfter = Math.ceil((windowMs - (now - entry.firstRequest)) / 1000);
        return { allowed: false, retryAfter };
      }
      
      entry.count++;
      return { allowed: true };
    }
  };
}