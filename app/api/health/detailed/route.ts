import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { cache } from '@/lib/cache/memory-cache';
import { rateLimitRelaxed } from '@/lib/rate-limit/index';
import { createLogger } from '@/lib/logger';
import os from 'os';

const logger = createLogger('health-check');

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    supabase: CheckResult;
    cache: CheckResult;
    redis?: CheckResult;
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      load: number[];
      cores: number;
    };
    requests?: {
      total: number;
      errors: number;
      avgResponseTime: number;
    };
  };
}

interface CheckResult {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
  details?: any;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Note: $metrics is only available with specific Prisma configurations
    // const metrics = await prisma.$metrics.json();
    
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      details: {
        // pool: metrics, // Commented out - $metrics requires specific Prisma config
      },
    };
  } catch (error) {
    logger.error('Database health check failed', { error });
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkSupabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from('User').select('id').limit(1);
    
    if (error) throw error;
    
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.error('Supabase health check failed', { error });
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkCache(): Promise<CheckResult> {
  const start = Date.now();
  try {
    // Test cache set and get
    const testKey = 'health-check-test';
    const testValue = { timestamp: Date.now() };
    
    cache.set('system', testKey, testValue, 60000); // 1 minute TTL
    const retrieved = cache.get('system', testKey);
    
    if (!retrieved || (retrieved as any).timestamp !== testValue.timestamp) {
      throw new Error('Cache read/write test failed');
    }
    
    // Get cache stats
    const stats = cache.getStats('system');
    
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      details: stats,
    };
  } catch (error) {
    logger.error('Cache health check failed', { error });
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRedis(): Promise<CheckResult | undefined> {
  // Check if Redis is configured
  if (!process.env.REDIS_URL) {
    return undefined;
  }
  
  const start = Date.now();
  try {
    // Dynamic import to avoid errors if Redis is not configured
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL);
    
    await redis.ping();
    const info = await redis.info();
    
    await redis.quit();
    
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      details: {
        connected: true,
        info: info.split('\n').slice(0, 5).join('\n'), // First 5 lines of info
      },
    };
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export const GET = rateLimitRelaxed(async (request: NextRequest) => {
  const start = Date.now();
  
  try {
    // Run all health checks in parallel
    const [database, supabase, cacheResult, redis] = await Promise.all([
      checkDatabase(),
      checkSupabase(),
      checkCache(),
      checkRedis(),
    ]);
    
    // Determine overall status
    const checks: {
      database: CheckResult;
      supabase: CheckResult;
      cache: CheckResult;
      redis?: CheckResult;
    } = { database, supabase, cache: cacheResult };
    if (redis) {
      checks.redis = redis;
    }
    
    const unhealthyChecks = Object.values(checks).filter(
      (check) => check.status === 'unhealthy'
    );
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyChecks.length === 0) {
      status = 'healthy';
    } else if (unhealthyChecks.length === 1) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    // Collect system metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    
    const health: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks,
      metrics: {
        memory: {
          used: Math.round(usedMem / 1024 / 1024), // MB
          total: Math.round(totalMem / 1024 / 1024), // MB
          percentage: Math.round((usedMem / totalMem) * 100),
        },
        cpu: {
          load: os.loadavg(),
          cores: os.cpus().length,
        },
      },
    };
    
    // Log health check completion
    logger.info('Health check completed', {status, duration: Date.now() - start, checks: Object.entries(checks).reduce((acc, [key, value]) => { acc[key] = value.status; return acc; }, {} as Record<string, string>),});
    
    // Set appropriate status code
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed', { error });
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
});