import { cache } from './memory-cache';

/**
 * Invalidate user-specific caches when their data changes
 */
export function invalidateUserCache(userId: string) {
  // Clear user points cache
  const pointsKey = `points:${userId}`;
  cache.delete('userPoints', pointsKey);
}

/**
 * Invalidate leaderboard caches when rankings might change
 */
export function invalidateLeaderboardCache() {
  // Clear all leaderboard caches
  cache.clear('leaderboard');
}

/**
 * Invalidate analytics caches when new votes come in
 */
export function invalidateAnalyticsCache() {
  // Clear vote analytics
  cache.clear('voteAnalytics');
  // Clear model rankings
  cache.clear('modelRankings');
}

/**
 * Invalidate all caches (use sparingly)
 */
export function invalidateAllCaches() {
  cache.clearAll();
}