import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { cache } from '@/lib/cache/memory-cache';
import { createLogger } from '@/lib/logger';

const logger = createLogger('admin-cache-stats');

// Simple admin check - you should enhance this for production
async function isAdmin(userId: string): Promise<boolean> {
  // Add your admin user IDs here
  const adminIds = process.env.ADMIN_USER_IDS?.split(',') || [];
  return adminIds.includes(userId);
}

export async function GET() {
  try {
    // Check if user is authenticated and is admin
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get cache statistics
    const cacheNames = ['leaderboard', 'userPoints', 'modelRankings', 'voteAnalytics'];
    const stats: Record<string, any> = {};

    for (const name of cacheNames) {
      const cacheStats = cache.getStats(name);
      if (cacheStats) {
        stats[name] = {
          ...cacheStats,
          memoryUsage: `${cacheStats.size}/${cacheStats.max} items`,
          ttl: `${cacheStats.ttl / 1000}s`,
        };
      }
    }

    return NextResponse.json({
      cacheStats: stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Cache stats error', error);
    return NextResponse.json(
      { error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}