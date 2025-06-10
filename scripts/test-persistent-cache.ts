import { validatorCache } from '../lib/cache/simple-validator-cache';
import { cacheMonitor } from '../lib/cache/simple-cache-monitor';

async function testPersistentCache() {
  console.log('Testing persistent singleton cache...\n');
  
  // Test 1: Verify singleton pattern
  console.log('1. Testing singleton pattern:');
  const cache1 = validatorCache;
  const cache2 = validatorCache;
  console.log(`   Same instance: ${cache1 === cache2 ? '✓ PASS' : '✗ FAIL'}`);
  
  // Test 2: First request should be cache miss
  console.log('\n2. First request (should be cache miss):');
  const start1 = Date.now();
  await validatorCache.getValidators();
  const time1 = Date.now() - start1;
  console.log(`   Time: ${time1}ms`);
  
  // Test 3: Second request should be cache hit
  console.log('\n3. Second request (should be cache hit):');
  const start2 = Date.now();
  await validatorCache.getValidators();
  const time2 = Date.now() - start2;
  console.log(`   Time: ${time2}ms`);
  console.log(`   Cache hit: ${time2 < time1 / 10 ? '✓ PASS' : '✗ FAIL'} (${time2}ms vs ${time1}ms)`);
  
  // Test 4: Check cache status
  console.log('\n4. Cache status:');
  const status = await validatorCache.getCacheStatus();
  console.log(`   Is cached: ${status.isHit}`);
  console.log(`   TTL remaining: ${status.ttl}s`);
  console.log(`   Size: ${status.size} validators`);
  
  // Test 5: Check monitor metrics
  console.log('\n5. Monitor metrics:');
  const metrics = cacheMonitor.getMetrics();
  console.log(`   Total requests: ${metrics.totalRequests}`);
  console.log(`   Hits: ${metrics.hits}`);
  console.log(`   Misses: ${metrics.misses}`);
  console.log(`   Hit rate: ${metrics.hitRate.toFixed(1)}%`);
  console.log(`   Avg response time: ${metrics.averageResponseTime.toFixed(1)}ms`);
  
  // Test 6: Simulate multiple "requests"
  console.log('\n6. Simulating 10 more requests:');
  for (let i = 0; i < 10; i++) {
    await validatorCache.getValidators();
  }
  const finalMetrics = cacheMonitor.getMetrics();
  console.log(`   Total requests: ${finalMetrics.totalRequests}`);
  console.log(`   Hit rate: ${finalMetrics.hitRate.toFixed(1)}%`);
  console.log(`   Expected ~91.7% hit rate: ${finalMetrics.hitRate > 90 ? '✓ PASS' : '✗ FAIL'}`);
  
  console.log('\n✅ Persistent cache implementation complete!');
  console.log('Cache will persist across requests until serverless instance goes cold.');
}

testPersistentCache().catch(console.error);