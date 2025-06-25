import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/query-wrapper";

export async function GET() {
  try {
    // Direct database query
    const dbValidators = await prisma.validator.findMany({
      select: {
        id: true,
        profileName: true,
        active: true,
        provider: true,
        modelName: true,
      },
      take: 5 // Just get first 5 for debugging
    });
    
    // Check cache status
    const { validatorCache } = await import("@/lib/cache/simple-validator-cache");
    const cacheStatus = await validatorCache.getCacheStatus();
    
    // Check registry
    const { validatorRegistry } = await import("@/lib/validators/registry");
    const registryValidators = await validatorRegistry.getAllValidators();
    
    // Check environment variables
    const env = {
      VALIDATOR_CACHE_ENABLED: process.env.VALIDATOR_CACHE_ENABLED || 'not set',
      VALIDATOR_CACHE_TTL: process.env.VALIDATOR_CACHE_TTL || 'not set',
      NODE_ENV: process.env.NODE_ENV,
    };
    
    // Get database connection info (safely, without exposing credentials)
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || '';
    const dbInfo = {
      host: dbUrl.includes('@') ? dbUrl.split('@')[1]?.split(':')[0] : 'unknown',
      database: dbUrl.includes('/') ? dbUrl.split('/').pop()?.split('?')[0] : 'unknown',
      isPooled: dbUrl.includes('pooler.supabase.com'),
      hasPoolerParam: dbUrl.includes('pgbouncer=true'),
    };
    
    return NextResponse.json({
      database: {
        connection: dbInfo,
        count: await prisma.validator.count(),
        activeCount: await prisma.validator.count({ where: { active: true } }),
        sample: dbValidators
      },
      cache: cacheStatus,
      registry: {
        count: registryValidators.length,
        sample: registryValidators.slice(0, 2).map(v => ({ id: v.id, name: v.name }))
      },
      environment: env
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Debug failed" },
      { status: 500 }
    );
  }
}