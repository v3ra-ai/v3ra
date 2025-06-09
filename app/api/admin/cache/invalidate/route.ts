import { NextResponse } from 'next/server';
import { validatorCache } from '@/lib/cache/validator-cache';

export async function POST() {
  try {
    // Invalidate the cache
    await validatorCache.invalidateCache();
    
    // Optionally warm the cache immediately after invalidation
    const warmCache = process.env.WARM_CACHE_ON_INVALIDATE !== 'false';
    if (warmCache) {
      await validatorCache.warmCache();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cache invalidated successfully',
      warmed: warmCache,
    });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: (error as Error).message || 'Failed to invalidate cache' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = await validatorCache.getCacheStatus();
    return NextResponse.json({
      success: true,
      cache: status,
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: (error as Error).message || 'Failed to get cache status' 
      },
      { status: 500 }
    );
  }
}
