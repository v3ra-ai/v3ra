import { Validator } from '@prisma/client';
import { cacheMonitor } from './simple-cache-monitor';

// Cache configuration
const CACHE_TTL = parseInt(process.env.VALIDATOR_CACHE_TTL || '600', 10); // Default 10 minutes
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

/**
 * Persistent in-memory cache for validators
 * 
 * Uses singleton pattern to persist cache across requests within the same
 * serverless instance. Cache survives between requests until the instance
 * goes cold (typically 5-15 minutes on Vercel).
 * 
 * This provides significant performance improvements by reducing database
 * queries from every request to once per TTL period per instance.
 */
class SimpleValidatorCache implements ValidatorCacheService {
  private static instance: SimpleValidatorCache;
  private cache: {
    data: ValidatorWithKeys[] | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0,
  };

  private constructor() {
    console.log('[ValidatorCache] Persistent singleton cache initialized');
  }

  static getInstance(): SimpleValidatorCache {
    if (!SimpleValidatorCache.instance) {
      SimpleValidatorCache.instance = new SimpleValidatorCache();
    }
    return SimpleValidatorCache.instance;
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

    // Check if we have valid cached data
    const cached = this.getFromCache();
    if (cached) {
      const responseTime = Date.now() - startTime;
      cacheMonitor.recordCacheHit(responseTime);
      console.log(`[ValidatorCache] Cache hit (${responseTime}ms)`);
      return cached;
    }

    // Cache miss - fetch from database
    console.log('[ValidatorCache] Cache miss - fetching from database');
    const validators = await this.fetchFromDatabase();
    const responseTime = Date.now() - startTime;
    cacheMonitor.recordCacheMiss(responseTime);
    console.log(`[ValidatorCache] Cache miss (${responseTime}ms)`);
    
    // Store in cache for next time
    this.setCache(validators);
    
    return validators;
  }

  private getFromCache(): ValidatorWithKeys[] | null {
    // Check if cache exists and is still valid
    if (
      this.cache.data && 
      Date.now() - this.cache.timestamp < CACHE_TTL * 1000
    ) {
      return this.cache.data;
    }

    return null;
  }

  private setCache(validators: ValidatorWithKeys[]): void {
    this.cache = {
      data: validators,
      timestamp: Date.now(),
    };
    console.log(`[ValidatorCache] Stored ${validators.length} validators in memory cache`);
  }

  private async fetchFromDatabase(): Promise<ValidatorWithKeys[]> {
    // Dynamic import to avoid circular dependencies
    const { validatorService } = await import('../services/validatorService');
    return validatorService.getAllValidatorsFromDB();
  }

  async invalidateCache(): Promise<void> {
    console.log('[ValidatorCache] Invalidating cache');
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }

  async getCacheStatus(): Promise<CacheStatus> {
    const hasData = !!this.cache.data;
    const age = Date.now() - this.cache.timestamp;
    const isValid = hasData && age < CACHE_TTL * 1000;

    if (!isValid) {
      return {
        isHit: false,
        lastUpdated: null,
        expiresAt: null,
        size: 0,
        ttl: 0,
      };
    }

    const ttl = Math.floor((CACHE_TTL * 1000 - age) / 1000);
    
    return {
      isHit: true,
      lastUpdated: new Date(this.cache.timestamp),
      expiresAt: new Date(this.cache.timestamp + CACHE_TTL * 1000),
      size: this.cache.data?.length || 0,
      ttl: ttl > 0 ? ttl : 0,
    };
  }

  async warmCache(): Promise<void> {
    console.log('[ValidatorCache] Warming cache...');
    try {
      const validators = await this.fetchFromDatabase();
      this.setCache(validators);
      console.log(`[ValidatorCache] Cache warmed with ${validators.length} validators`);
    } catch (error) {
      console.error('[ValidatorCache] Error warming cache:', error);
      throw error;
    }
  }

  // No-op for simple cache - no connections to close
  async disconnect(): Promise<void> {
    // Nothing to disconnect
  }
}

// Export singleton instance
// This persists across requests within the same serverless instance
// providing cached data until the instance goes cold (5-15 minutes)
export const validatorCache = SimpleValidatorCache.getInstance();