#!/usr/bin/env node
import { validatorCache } from '../lib/cache/validator-cache';
import { cacheMonitor } from '../lib/cache/cache-monitor';

// Add colors for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

async function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testValidatorCache() {
  log('\n🚀 Starting Validator Cache Performance Test\n', colors.blue);

  try {
    // Test 1: Initial fetch (cache miss)
    log('Test 1: Initial fetch (expect cache miss)', colors.yellow);
    const start1 = Date.now();
    const validators1 = await validatorCache.getValidators();
    const time1 = Date.now() - start1;
    log(`✓ Fetched ${validators1.length} validators in ${time1}ms\n`, colors.green);

    // Test 2: Second fetch (cache hit)
    log('Test 2: Second fetch (expect cache hit)', colors.yellow);
    const start2 = Date.now();
    const validators2 = await validatorCache.getValidators();
    const time2 = Date.now() - start2;
    log(`✓ Fetched ${validators2.length} validators in ${time2}ms`, colors.green);
    log(`⚡ Performance improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%\n`, colors.magenta);

    // Test 3: Multiple rapid fetches
    log('Test 3: Running 10 rapid fetches', colors.yellow);
    const times: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await validatorCache.getValidators();
      times.push(Date.now() - start);
    }
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    log(`✓ Average response time: ${avgTime.toFixed(2)}ms\n`, colors.green);

    // Test 4: Cache status
    log('Test 4: Checking cache status', colors.yellow);
    const status = await validatorCache.getCacheStatus();
    log('Cache Status:', colors.blue);
    log(`  - Cache Hit: ${status.isHit ? 'Yes' : 'No'}`);
    log(`  - Size: ${status.size} validators`);
    log(`  - TTL: ${status.ttl} seconds`);
    log(`  - Last Updated: ${status.lastUpdated?.toISOString() || 'N/A'}`);
    log(`  - Expires At: ${status.expiresAt?.toISOString() || 'N/A'}\n`);

    // Test 5: Cache metrics
    log('Test 5: Cache metrics', colors.yellow);
    const health = await cacheMonitor.getCacheHealth();
    log('Cache Metrics:', colors.blue);
    log(`  - Hit Rate: ${health.metrics.hitRate.toFixed(1)}%`);
    log(`  - Total Requests: ${health.metrics.totalRequests}`);
    log(`  - Hits: ${health.metrics.hits}`);
    log(`  - Misses: ${health.metrics.misses}`);
    log(`  - Avg Response Time: ${health.metrics.averageResponseTime.toFixed(2)}ms\n`);

    // Test 6: Cache invalidation
    log('Test 6: Testing cache invalidation', colors.yellow);
    await validatorCache.invalidateCache();
    log('✓ Cache invalidated', colors.green);
    
    const start3 = Date.now();
    const validators3 = await validatorCache.getValidators();
    const time3 = Date.now() - start3;
    log(`✓ Fetched ${validators3.length} validators in ${time3}ms (after invalidation)\n`, colors.green);

    // Test 7: Cache warming
    log('Test 7: Testing cache warming', colors.yellow);
    await validatorCache.warmCache();
    log('✓ Cache warmed successfully\n', colors.green);

    // Final health check
    const finalHealth = await cacheMonitor.getCacheHealth();
    log('🎯 Final Cache Health:', colors.magenta);
    log(`  - Is Healthy: ${finalHealth.health.isHealthy ? 'Yes ✓' : 'No ✗'}`);
    if (finalHealth.health.recommendations.length > 0) {
      log('  - Recommendations:', colors.yellow);
      finalHealth.health.recommendations.forEach(rec => {
        log(`    • ${rec}`);
      });
    } else {
      log('  - No recommendations - cache is performing well!', colors.green);
    }

    log('\n✅ All tests completed successfully!\n', colors.green);

  } catch (error) {
    log(`\n❌ Test failed: ${(error as Error).message}\n`, colors.red);
    process.exit(1);
  }

  // Gracefully disconnect
  await validatorCache.disconnect();
  process.exit(0);
}

// Run the test
testValidatorCache();
