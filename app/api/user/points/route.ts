import { NextRequest, NextResponse } from "next/server";
import { V3RAPointsService } from "@/lib/services/v3ra-points";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { prisma } from "@/lib/db/client";
import { rateLimitRelaxed } from "@/lib/rate-limit/index";
import { ensureUserExists } from "@/lib/auth/ensure-user";
import { isValidUUID } from "@/utils/security-utils";
import { cache, getCacheKey } from "@/lib/cache/memory-cache";
import { pointsLogger } from "@/lib/logger";

export const GET = rateLimitRelaxed(async (request: NextRequest) => {
  try {
    // Always get user from Supabase session - never trust client-provided userId
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    const userId = user.id;
    const userEmail = user.email || "";
    
    // Try cache first
    const cacheKey = getCacheKey('points', userId);
    const cached = cache.get('userPoints', cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }
    
    // Ensure user exists in database
    const { success: userExists, error: userError } = await ensureUserExists(userId, userEmail);
    
    if (!userExists) {
      return NextResponse.json(
        { error: userError || "Failed to ensure user exists" },
        { status: 500 }
      );
    }
    
    // Get user points
    let userPoints;
    try {
      userPoints = await V3RAPointsService.getUserPoints(userId);
    } catch (error) {
      pointsLogger.error('Failed to get user points from service', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId
      });
      throw error;
    }
    
    // Get transaction history
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Get last 10 transactions
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        createdAt: true,
      }
    });
    
    // Format history for frontend
    const history = transactions.map(tx => ({
      amount: Number(tx.amount),
      description: tx.description || getTransactionDescription(tx.type),
      createdAt: tx.createdAt.toISOString(),
      type: tx.type
    }));
    
    const response = {
      userId,
      balance: Number(userPoints.balance),
      totalEarned: Number(userPoints.totalEarned),
      totalSpent: Number(userPoints.totalSpent),
      streak: userPoints.streak,
      level: userPoints.level,
      history
    };
    
    // Cache the response
    cache.set('userPoints', cacheKey, response);
    
    return NextResponse.json(response);
    
  } catch (error) {
    pointsLogger.error('Failed to get user points', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: '/api/user/points'
    });
    return NextResponse.json(
      { error: "Failed to get user points" },
      { status: 500 }
    );
  }
});

function getTransactionDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'DAILY_BONUS': 'Daily bonus claimed',
    'BET_WIN': 'Won prediction bet',
    'BET_LOSS': 'Lost prediction bet',
    'MARKET_CREATE': 'Created prediction market',
    'VERIFICATION_REWARD': 'Verification reward',
    'STAKE_REFUND': 'Market stake refunded',
    'INITIAL_GRANT': 'Welcome bonus'
  };
  
  return descriptions[type] || type.replace(/_/g, ' ').toLowerCase();
}