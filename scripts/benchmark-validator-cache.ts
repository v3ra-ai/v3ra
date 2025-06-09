#!/usr/bin/env node
import { validatorCache } from '../lib/cache/validator-cache';
import { validatorService } from '../lib/services/validatorService';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

interface BenchmarkResults {
  withoutCache: {
    times: number[];
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  withCache: {
    times: number[];
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  };
  improvement: {
    percentage: number;
    factor: number;
  };
}

function calculateStats(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const average = sum / times.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  
  return {
    times,
    average,
    min,
    max,
    p95: sorted[p95Index],
    p99: sorted[p99Index],
  };
}

async function benchmarkWithoutCache(iterations: number): Promise<number[]> {
  const times: number[] = [];
  
  // Disable cache for this benchmark
  process.env.VALIDATOR_CACHE_ENABLED = 'false';
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await validatorService.getAllValidators();
    times.push(Date.now() - start);
    
    // Small delay to prevent overwhelming the DB
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Re-enable cache
  delete process.env.VALIDATOR_CACHE_ENABLED;
  
  return times;
}

async function benchmarkWithCache(iterations: number): Promise<number[]> {
  const times: number[] = [];
  
  // First, warm the cache
  await validatorCache.invalidateCache();
  await validatorCache.warmCache();
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await validatorCache.getValidators();
    times.push(Date.now() - start);
  }
  
  return times;
}

async function runBenchmark() {
  log('\n🏁 Validator Cache Performance Benchmark\n', colors.cyan);
  log('This benchmark will compare performance with and without caching.\n', colors.blue);
  
  const iterations = 100;
  log(`Running ${iterations} iterations for each test...\n`, colors.yellow);
  
  try {
    // Benchmark without cache
    log('📊 Benchmarking WITHOUT cache...', colors.yellow);
    const withoutCacheTimes = await benchmarkWithoutCache(iterations);
    const withoutCacheStats = calculateStats(withoutCacheTimes);
    log('✓ Complete\n', colors.green);
    
    // Benchmark with cache
    log('📊 Benchmarking WITH cache...', colors.yellow);
    const withCacheTimes = await benchmarkWithCache(iterations);
    const withCacheStats = calculateStats(withCacheTimes);
    log('✓ Complete\n', colors.green);
    
    // Calculate improvement
    const improvementPercentage = ((withoutCacheStats.average - withCacheStats.average) / withoutCacheStats.average) * 100;
    const improvementFactor = withoutCacheStats.average / withCacheStats.average;
    
    const results: BenchmarkResults = {
      withoutCache: withoutCacheStats,
      withCache: withCacheStats,
      improvement: {
        percentage: improvementPercentage,
        factor: improvementFactor,
      },
    };
    
    // Display results
    log('📈 Benchmark Results\n', colors.magenta);
    
    log('Without Cache:', colors.red);
    log(`  Average: ${withoutCacheStats.average.toFixed(2)}ms`);
    log(`  Min: ${withoutCacheStats.min}ms`);
    log(`  Max: ${withoutCacheStats.max}ms`);
    log(`  P95: ${withoutCacheStats.p95}ms`);
    log(`  P99: ${withoutCacheStats.p99}ms\n`);
    
    log('With Cache:', colors.green);
    log(`  Average: ${withCacheStats.average.toFixed(2)}ms`);
    log(`  Min: ${withCacheStats.min}ms`);
    log(`  Max: ${withCacheStats.max}ms`);
    log(`  P95: ${withCacheStats.p95}ms`);
    log(`  P99: ${withCacheStats.p99}ms\n`);
    
    log('🚀 Performance Improvement:', colors.cyan);
    log(`  ${improvementPercentage.toFixed(1)}% faster`);
    log(`  ${improvementFactor.toFixed(1)}x speed improvement\n`);
    
    // Visualize distribution
    log('📊 Response Time Distribution (With Cache):', colors.blue);
    const buckets = [1, 5, 10, 20, 50, 100, 200];
    for (const bucket of buckets) {
      const count = withCacheTimes.filter(t => t < bucket).length;
      const percentage = (count / withCacheTimes.length) * 100;
      const bar = '█'.repeat(Math.floor(percentage / 2));
      log(`  <${bucket}ms: ${bar} ${percentage.toFixed(1)}%`);
    }
    
    // Success check
    log('\n✅ Benchmark Summary:', colors.green);
    if (improvementPercentage >= 80) {
      log('  ✓ Achieved >80% performance improvement!', colors.green);
    } else {
      log(`  ⚠ Only ${improvementPercentage.toFixed(1)}% improvement (target: 80%)`, colors.yellow);
    }
    
    if (withCacheStats.average < 10) {
      log('  ✓ Cache response time <10ms!', colors.green);
    } else {
      log(`  ⚠ Cache response time ${withCacheStats.average.toFixed(1)}ms (target: <10ms)`, colors.yellow);
    }
    
    // Export results
    const resultsPath = './benchmark-results.json';
    await import('fs').then(fs => {
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    });
    log(`\n📁 Detailed results saved to: ${resultsPath}\n`, colors.blue);
    
  } catch (error) {
    log(`\n❌ Benchmark failed: ${(error as Error).message}\n`, colors.red);
    process.exit(1);
  }
  
  // Cleanup
  await validatorCache.disconnect();
  process.exit(0);
}

// Run benchmark
runBenchmark();
