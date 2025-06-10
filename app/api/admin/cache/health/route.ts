import { NextResponse } from 'next/server';
import { cacheMonitor } from '@/lib/cache/cache-monitor';

export async function GET() {
  try {
    const health = await cacheMonitor.getCacheHealth();
    
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
