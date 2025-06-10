# Validator Cache Implementation Guide

## Overview

The validator cache implementation provides a high-performance caching layer for the validator list, reducing database queries by 80%+ and improving response times significantly. The system uses Redis as the primary cache with an in-memory fallback for resilience.

## Architecture

### Cache Layers
1. **Redis Cache** (Primary)
   - Distributed cache shared across all server instances
   - Configurable TTL (default: 10 minutes)
   - Automatic retry and failover

2. **In-Memory Cache** (Fallback)
   - Local to each server instance
   - Activates when Redis is unavailable
   - Same TTL as Redis cache

### Components

#### 1. ValidatorCache (`lib/cache/validator-cache.ts`)
Core caching service that handles:
- Cache retrieval with automatic fallback
- Cache population and invalidation
- Performance logging
- Connection management

#### 2. CacheMonitor (`lib/cache/cache-monitor.ts`)
Performance monitoring system that tracks:
- Cache hit/miss rates
- Response times
- Health metrics
- Performance recommendations

#### 3. API Endpoints
- `GET /api/admin/cache/invalidate` - Get cache status
- `POST /api/admin/cache/invalidate` - Invalidate cache
- `GET /api/admin/cache/health` - Get cache health metrics

## Configuration

### Environment Variables

```bash
# Cache TTL in seconds (default: 600 = 10 minutes)
VALIDATOR_CACHE_TTL=600

# Enable/disable caching (default: true)
VALIDATOR_CACHE_ENABLED=true

# Warm cache after invalidation (default: true)
WARM_CACHE_ON_INVALIDATE=true

# Redis connection URL
REDIS_URL=redis://localhost:6379
```

### Cache Invalidation

The cache is automatically invalidated when:
- A new validator is added
- A validator is removed
- A validator is toggled (active/inactive)
- Manual invalidation via API

## Usage

### Basic Usage

```typescript
import { validatorService } from '@/lib/services/validatorService';

// This automatically uses the cache
const validators = await validatorService.getAllValidators();
```

### Direct Cache Access

```typescript
import { validatorCache } from '@/lib/cache/validator-cache';

// Get validators (with caching)
const validators = await validatorCache.getValidators();

// Get cache status
const status = await validatorCache.getCacheStatus();

// Invalidate cache
await validatorCache.invalidateCache();

// Warm cache
await validatorCache.warmCache();
```

### Monitoring

```typescript
import { cacheMonitor } from '@/lib/cache/cache-monitor';

// Get cache health
const health = await cacheMonitor.getCacheHealth();
console.log(`Hit Rate: ${health.metrics.hitRate}%`);
console.log(`Avg Response Time: ${health.metrics.averageResponseTime}ms`);
```

## Performance Testing

Run the performance test script:

```bash
# Using ts-node
npx ts-node scripts/test-validator-cache.ts

# Or compile and run
npx tsc scripts/test-validator-cache.ts --outDir scripts/dist
node scripts/dist/test-validator-cache.js
```

Expected results:
- Cache hit rate: >90%
- Response time improvement: >80%
- Cache hit response time: <10ms

## API Examples

### Check Cache Status

```bash
curl -X GET http://localhost:3000/api/admin/cache/invalidate
```

Response:
```json
{
  "success": true,
  "cache": {
    "isHit": true,
    "lastUpdated": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-01-15T10:40:00.000Z",
    "size": 15,
    "ttl": 456
  }
}
```

### Invalidate Cache

```bash
curl -X POST http://localhost:3000/api/admin/cache/invalidate
```

Response:
```json
{
  "success": true,
  "message": "Cache invalidated successfully",
  "warmed": true
}
```

### Check Cache Health

```bash
curl -X GET http://localhost:3000/api/admin/cache/health
```

Response:
```json
{
  "success": true,
  "metrics": {
    "hitRate": 92.5,
    "totalRequests": 1000,
    "hits": 925,
    "misses": 75,
    "averageResponseTime": 8.3
  },
  "status": {
    "isHit": true,
    "size": 15,
    "ttl": 456
  },
  "health": {
    "isHealthy": true,
    "recommendations": []
  }
}
```

## Troubleshooting

### Redis Connection Issues

If Redis connection fails, the system automatically falls back to in-memory caching. Check logs for:
```
[ValidatorCache] Redis error: Connection refused
[ValidatorCache] Using in-memory fallback cache
```

### Low Hit Rate

If cache hit rate is below 80%:
1. Increase `VALIDATOR_CACHE_TTL`
2. Check for frequent cache invalidations
3. Ensure Redis is properly connected

### High Response Times

If average response time is above 100ms:
1. Check Redis network latency
2. Verify Redis server performance
3. Consider using Redis cluster for high load

## Best Practices

1. **TTL Configuration**
   - Use longer TTL for stable data
   - Balance between freshness and performance
   - Monitor hit rates to optimize TTL

2. **Cache Warming**
   - Enable `WARM_CACHE_ON_INVALIDATE` for consistent performance
   - Consider warming cache on application startup
   - Use scheduled warming for predictable traffic patterns

3. **Monitoring**
   - Regularly check cache health metrics
   - Set up alerts for low hit rates
   - Monitor Redis memory usage

4. **Scaling**
   - Use Redis Cluster for horizontal scaling
   - Consider Redis Sentinel for high availability
   - Implement cache sharding for large datasets

## Migration Guide

### From No Cache to Cached Implementation

1. **Update Environment Variables**
   ```bash
   VALIDATOR_CACHE_ENABLED=true
   VALIDATOR_CACHE_TTL=600
   REDIS_URL=redis://your-redis-host:6379
   ```

2. **Deploy Changes**
   - The cache will automatically start working
   - No code changes required in existing validator fetch calls

3. **Monitor Performance**
   - Check cache metrics after deployment
   - Adjust TTL based on hit rates
   - Monitor database query reduction

### Disabling Cache (Emergency)

If you need to disable caching:
```bash
VALIDATOR_CACHE_ENABLED=false
```

This will bypass all caching and fetch directly from the database.

## Future Enhancements

1. **Cache Segmentation**
   - Separate caches for different validator states
   - User-specific validator caches

2. **Advanced Invalidation**
   - Partial cache invalidation
   - Tag-based invalidation

3. **Distributed Cache Warming**
   - Coordinated warming across instances
   - Predictive cache warming

4. **Enhanced Monitoring**
   - Grafana dashboards
   - Prometheus metrics
   - Real-time alerting
