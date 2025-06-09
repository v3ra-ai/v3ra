import { validatorCache } from './validator-cache';

interface CacheMetrics {
  hitRate: number;
  totalRequests: number;
  hits: number;
  misses: number;
  averageResponseTime: number;
  lastReset: Date;
}

class CacheMonitor {
  private metrics: CacheMetrics = {
    hitRate: 0,
    totalRequests: 0,
    hits: 0,
    misses: 0,
    averageResponseTime: 0,
    lastReset: new Date(),
  };

  private responseTimes: number[] = [];
  private maxSamples = 1000;

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

  async getCacheHealth() {
    const metrics = this.getMetrics();
    const status = await validatorCache.getCacheStatus();
    
    return {
      metrics,
      status,
      health: {
        isHealthy: metrics.hitRate > 80 && metrics.averageResponseTime < 100,
        recommendations: this.getRecommendations(metrics, status),
      },
    };
  }

  private getRecommendations(metrics: CacheMetrics, status: any): string[] {
    const recommendations: string[] = [];

    if (metrics.hitRate < 80) {
      recommendations.push('Cache hit rate is below 80%. Consider increasing cache TTL.');
    }

    if (metrics.averageResponseTime > 100) {
      recommendations.push('Average response time is high. Check Redis connection and network latency.');
    }

    if (status.ttl < 60) {
      recommendations.push('Cache TTL is very low. Consider increasing to reduce database load.');
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

export const cacheMonitor = new CacheMonitor();
