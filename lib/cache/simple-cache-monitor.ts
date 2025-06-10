interface CacheMetrics {
  hitRate: number;
  totalRequests: number;
  hits: number;
  misses: number;
  averageResponseTime: number;
  lastReset: Date;
}

interface CacheStatus {
  isHit: boolean;
  lastUpdated: Date | null;
  expiresAt: Date | null;
  size: number;
  ttl: number;
}

/**
 * Persistent cache monitor for tracking cache performance
 * Uses singleton pattern to maintain metrics across requests
 * within the same serverless instance
 */
class SimpleCacheMonitor {
  private static instance: SimpleCacheMonitor;
  private metrics: CacheMetrics = {
    hitRate: 0,
    totalRequests: 0,
    hits: 0,
    misses: 0,
    averageResponseTime: 0,
    lastReset: new Date(),
  };

  private responseTimes: number[] = [];
  private maxSamples = 1000; // Increased since we persist across requests

  private constructor() {
    console.log('[CacheMonitor] Persistent singleton monitor initialized');
  }

  static getInstance(): SimpleCacheMonitor {
    if (!SimpleCacheMonitor.instance) {
      SimpleCacheMonitor.instance = new SimpleCacheMonitor();
    }
    return SimpleCacheMonitor.instance;
  }

  recordCacheHit(responseTime: number) {
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.recordResponseTime(responseTime);
    this.updateHitRate();
  }

  recordCacheMiss(responseTime: number) {
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.recordResponseTime(responseTime);
    this.updateHitRate();
  }

  private recordResponseTime(responseTime: number) {
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }
    this.updateAverageResponseTime();
  }

  private updateHitRate() {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
    }
  }

  private updateAverageResponseTime() {
    if (this.responseTimes.length > 0) {
      const sum = this.responseTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageResponseTime = sum / this.responseTimes.length;
    }
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  async getCacheHealth(cacheStatus: CacheStatus) {
    const metrics = this.getMetrics();
    
    return {
      metrics,
      status: cacheStatus,
      health: {
        isHealthy: metrics.averageResponseTime < 100,
        recommendations: this.getRecommendations(metrics, cacheStatus),
      },
    };
  }

  private getRecommendations(metrics: CacheMetrics, status: CacheStatus): string[] {
    const recommendations: string[] = [];

    // Hit rate analysis now meaningful with persistent cache
    if (metrics.hitRate < 50 && metrics.totalRequests > 10) {
      recommendations.push('Low cache hit rate. Consider increasing TTL or warming cache on startup.');
    }
    
    if (metrics.averageResponseTime > 100) {
      recommendations.push('Average response time is high. Check database connection.');
    }

    if (status.ttl < 300) {
      recommendations.push('Cache TTL is low. Consider increasing to 10+ minutes for better performance.');
    }

    return recommendations;
  }

  reset() {
    this.metrics = {
      hitRate: 0,
      totalRequests: 0,
      hits: 0,
      misses: 0,
      averageResponseTime: 0,
      lastReset: new Date(),
    };
    this.responseTimes = [];
  }
}

export const cacheMonitor = SimpleCacheMonitor.getInstance();