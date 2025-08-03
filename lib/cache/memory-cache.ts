import { LRUCache } from 'lru-cache';
import { createLogger } from '@/lib/logger';

const logger = createLogger('memory-cache');

// Type-safe cache configuration
interface CacheConfig {
  max: number; // Maximum number of items
  ttl: number; // Time to live in milliseconds
  updateAgeOnGet?: boolean;
  updateAgeOnHas?: boolean;
}

// Cache configurations for different data types
const cacheConfigs: Record<string, CacheConfig> = {
  leaderboard: {
    max: 10,
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  userPoints: {
    max: 1000,
    ttl: 60 * 1000, // 1 minute
  },
  modelRankings: {
    max: 20,
    ttl: 10 * 60 * 1000, // 10 minutes
  },
  voteAnalytics: {
    max: 50,
    ttl: 5 * 60 * 1000, // 5 minutes
  },
};

// Create separate caches for different data types
const caches = new Map<string, LRUCache<string, any>>();

// Initialize caches
for (const [name, config] of Object.entries(cacheConfigs)) {
  caches.set(name, new LRUCache<string, any>(config));
}

// Type-safe cache operations
export class MemoryCache {
  private static instance: MemoryCache;
  
  private constructor() {}
  
  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  // Get from cache
  get<T>(cacheName: string, key: string): T | undefined {
    const cache = caches.get(cacheName);
    if (!cache) {
      logger.warn('Cache not found', { cacheName });
      return undefined;
    }
    return cache.get(key) as T | undefined;
  }

  // Set in cache
  set<T>(cacheName: string, key: string, value: T, ttl?: number): void {
    const cache = caches.get(cacheName);
    if (!cache) {
      logger.warn('Cache not found', { cacheName });
      return;
    }
    
    // Allow custom TTL override
    if (ttl) {
      cache.set(key, value, { ttl });
    } else {
      cache.set(key, value);
    }
  }

  // Delete from cache
  delete(cacheName: string, key: string): boolean {
    const cache = caches.get(cacheName);
    if (!cache) {
      return false;
    }
    return cache.delete(key);
  }

  // Clear entire cache
  clear(cacheName: string): void {
    const cache = caches.get(cacheName);
    if (cache) {
      cache.clear();
    }
  }

  // Clear all caches
  clearAll(): void {
    for (const cache of caches.values()) {
      cache.clear();
    }
  }

  // Get cache stats
  getStats(cacheName: string) {
    const cache = caches.get(cacheName);
    if (!cache) {
      return null;
    }
    
    return {
      size: cache.size,
      max: cache.max,
      ttl: cache.ttl,
      // Note: lru-cache doesn't provide hits/misses stats by default
    };
  }

  // Get or set (fetch if not in cache)
  async getOrSet<T>(
    cacheName: string,
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(cacheName, key);
    if (cached !== undefined) {
      return cached;
    }

    // Fetch and cache
    try {
      const value = await fetcher();
      this.set(cacheName, key, value, ttl);
      return value;
    } catch (error) {
      // On error, don't cache
      throw error;
    }
  }
}

// Export singleton instance
export const cache = MemoryCache.getInstance();

// Helper function for cache keys
export function getCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}