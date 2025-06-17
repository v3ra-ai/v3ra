/**
 * In-memory cache implementation with TTL support
 * This provides a simple caching solution without external dependencies
 */

import { VoteStats } from '@/lib/types';
import { SystemHealthReport } from '@/lib/services/llm-health-service';

export class InMemoryCache<T> {
  private cache = new Map<string, { data: T; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs = 60000) { // Clean up every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  /**
   * Store data in cache with TTL
   */
  set(key: string, data: T, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  /**
   * Retrieve data from cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached items
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy cache and clear interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Type for vote stats cache - can be individual stats or batch response
type VoteStatsData = VoteStats | Array<{
  validatorId: string;
  totalVotes: number;
  consensusMatchPercentage: number;
}>;

// Singleton instances for different cache types
export const llmHealthCache = new InMemoryCache<SystemHealthReport>();
export const voteStatsCache = new InMemoryCache<VoteStatsData>();