import { NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/cache/simple-cache-monitor';
import { validatorCache } from '@/lib/cache/simple-validator-cache';

export async function GET() {
  try {
    // Get cache status first
    const cacheStatus = await validatorCache.getCacheStatus();
    const health = await cacheMonitor.getCacheHealth(cacheStatus);
    
    return NextResponse.json({
      success: true,
      ...health,
    });
  } catch (error) {
    console.error('Error getting cache health:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: (error as Error).message || 'Failed to get cache health' 
      },
      { status: 500 }
    );
  }
}
