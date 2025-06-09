import Redis from 'ioredis';
import { Validator } from '@prisma/client';
import { cacheMonitor } from './cache-monitor';

// Cache configuration
const CACHE_TTL = parseInt(process.env.VALIDATOR_CACHE_TTL || '600', 10); // Default 10 minutes
const CACHE_KEY = 'validator_list_v1';
const CACHE_ENABLED = process.env.VALIDATOR_CACHE_ENABLED !== 'false';

// Types
export interface CacheStatus {
  isHit: boolean;
  lastUpdated: Date | null;
  expiresAt: Date | null;
  size: number;
  ttl: number;
}

interface ValidatorKey {
  id: string;
  createdAt: Date;
  validatorId: string;
  apiKeyId: string;
}

export interface ValidatorWithKeys extends Validator {
  apiKeys: ValidatorKey[];
}

export interface ValidatorCacheService {
  getValidators(): Promise<ValidatorWithKeys[]>;
  invalidateCache(): Promise<void>;
  getCacheStatus(): Promise<CacheStatus>;
  warmCache(): Promise<void>;
}

class ValidatorCache implements ValidatorCacheService {
  private redis: Redis | null = null;
  private fallbackCache: { data: ValidatorWithKeys[] | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };

  constructor() {
    // Initialize Redis connection
    this.initializeRedis();
  }

  private initializeRedis() {
    if (!CACHE_ENABLED) {
      console.log('[ValidatorCache] Caching disabled via environment variable');
      return;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.redis = new Redis(redisUrl, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 100, 2000);
        },
      });

      this.redis.on('error', (error) => {
        console.error('[ValidatorCache] Redis error:', error.message);
      });

      this.redis.on('connect', () => {
        console.log('[ValidatorCache] Redis connected successfully');
      });
    } catch (error) {
      console.error('[ValidatorCache] Failed to initialize Redis:', error);
      this.redis = null;
    }
  }

  async getValidators(): Promise<ValidatorWithKeys[]> {
    const startTime = Date.now();
    
    // If caching is disabled, always fetch from DB
    if (!CACHE_ENABLED) {
      const validators = await this.fetchFromDatabase();
      const responseTime = Date.now() - startTime;
      cacheMonitor.recordCacheMiss(responseTime);
      return validators;
    }

    // Try to get from cache
    try {
      const cached = await this.getFromCache();
      if (cached) {
        const responseTime = Date.now() - startTime;
        cacheMonitor.recordCacheHit(responseTime);
        console.log(`[ValidatorCache] Cache hit (${responseTime}ms)`);
        return cached;
      }
    } catch (error) {
      console.error('[ValidatorCache] Error retrieving from cache:', error);
    }

    // Cache miss - fetch from database
    console.log('[ValidatorCache] Cache miss - fetching from database');
    const validators = await this.fetchFromDatabase();
    const responseTime = Date.now() - startTime;
    cacheMonitor.recordCacheMiss(responseTime);
    console.log(`[ValidatorCache] Cache miss (${responseTime}ms)`);
    
    // Store in cache for next time
    await this.setCache(validators);
    
    return validators;
  }

  private async getFromCache(): Promise<ValidatorWithKeys[] | null> {
    // Try Redis first
    if (this.redis) {
      try {
        const cached = await this.redis.get(CACHE_KEY);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.error('[ValidatorCache] Redis get error:', error);
      }
    }

    // Fallback to in-memory cache
    if (this.fallbackCache.data && Date.now() - this.fallbackCache.timestamp < CACHE_TTL * 1000) {
      console.log('[ValidatorCache] Using in-memory fallback cache');
      return this.fallbackCache.data;
    }

    return null;
  }

  private async setCache(validators: ValidatorWithKeys[]): Promise<void> {
    // Store in Redis
    if (this.redis) {
      try {
        await this.redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(validators));
        console.log(`[ValidatorCache] Stored ${validators.length} validators in Redis cache`);
      } catch (error) {
        console.error('[ValidatorCache] Redis set error:', error);
      }
    }

    // Always update in-memory fallback
    this.fallbackCache = {
      data: validators,
      timestamp: Date.now(),
    };
  }

  private async fetchFromDatabase(): Promise<ValidatorWithKeys[]> {
    // Dynamic import to avoid circular dependencies
    const { validatorService } = await import('../services/validatorService');
    return validatorService.getAllValidatorsFromDB();
  }

  async invalidateCache(): Promise<void> {
    console.log('[ValidatorCache] Invalidating cache');
    
    // Clear Redis cache
    if (this.redis) {
      try {
        await this.redis.del(CACHE_KEY);
      } catch (error) {
        console.error('[ValidatorCache] Error invalidating Redis cache:', error);
      }
    }

    // Clear in-memory cache
    this.fallbackCache = {
      data: null,
      timestamp: 0,
    };
  }

  async getCacheStatus(): Promise<CacheStatus> {
    let isHit = false;
    let lastUpdated: Date | null = null;
    let expiresAt: Date | null = null;
    let size = 0;
    let ttl = 0;

    // Check Redis
    if (this.redis) {
      try {
        const cached = await this.redis.get(CACHE_KEY);
        if (cached) {
          isHit = true;
          ttl = await this.redis.ttl(CACHE_KEY);
          size = JSON.parse(cached).length;
          
          // Calculate timestamps
          const now = Date.now();
          lastUpdated = new Date(now - (CACHE_TTL - ttl) * 1000);
          expiresAt = new Date(now + ttl * 1000);
        }
      } catch (error) {
        console.error('[ValidatorCache] Error getting cache status:', error);
      }
    }

    // Fallback to in-memory cache status
    if (!isHit && this.fallbackCache.data) {
      const age = Date.now() - this.fallbackCache.timestamp;
      if (age < CACHE_TTL * 1000) {
        isHit = true;
        size = this.fallbackCache.data.length;
        lastUpdated = new Date(this.fallbackCache.timestamp);
        ttl = Math.floor((CACHE_TTL * 1000 - age) / 1000);
        expiresAt = new Date(this.fallbackCache.timestamp + CACHE_TTL * 1000);
      }
    }

    return {
      isHit,
      lastUpdated,
      expiresAt,
      size,
      ttl,
    };
  }

  async warmCache(): Promise<void> {
    console.log('[ValidatorCache] Warming cache...');
    try {
      const validators = await this.fetchFromDatabase();
      await this.setCache(validators);
      console.log(`[ValidatorCache] Cache warmed with ${validators.length} validators`);
    } catch (error) {
      console.error('[ValidatorCache] Error warming cache:', error);
      throw error;
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const validatorCache = new ValidatorCache();
