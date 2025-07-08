import { LRUCache } from 'lru-cache';

export interface RateLimiterOptions {
  interval: number; // Time window in milliseconds
  tokensPerInterval: number; // Number of requests allowed per interval
}

export class RateLimiter {
  private tokenCache: LRUCache<string, number>;
  private tokensPerInterval: number;

  constructor(options: RateLimiterOptions) {
    this.tokensPerInterval = options.tokensPerInterval;
    this.tokenCache = new LRUCache<string, number>({
      max: 1000, // Max number of unique tokens to track
      ttl: options.interval,
    });
  }

  async check(token: string): Promise<boolean> {
    const current = this.tokenCache.get(token) || 0;
    
    if (current >= this.tokensPerInterval) {
      return false; // Rate limit exceeded
    }
    
    this.tokenCache.set(token, current + 1);
    return true; // Request allowed
  }

  getRemainingTokens(token: string): number {
    const current = this.tokenCache.get(token) || 0;
    return Math.max(0, this.tokensPerInterval - current);
  }

  getLimit(): number {
    return this.tokensPerInterval;
  }
}