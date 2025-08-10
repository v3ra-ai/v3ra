import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('gpt-blind-test-stats');

export async function GET(_req: NextRequest) {
  try {
    // Get the count of completed test sessions
    const result = await prisma.$queryRaw<Array<{
      completed_tests: bigint;
      total_users: bigint;
    }>>`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tests,
        COUNT(DISTINCT user_id) as total_users
      FROM blind_test_sessions
      WHERE session_type = 'gpt_comparison'
    `;

    const stats = result[0] || { completed_tests: BigInt(0), total_users: BigInt(0) };

    return NextResponse.json({
      completedTests: Number(stats.completed_tests),
      totalUsers: Number(stats.total_users)
    });
  } catch (error) {
    logger.error('Error getting test stats:', error);
    return NextResponse.json(
      { error: 'Failed to get test statistics' },
      { status: 500 }
    );
  }
}