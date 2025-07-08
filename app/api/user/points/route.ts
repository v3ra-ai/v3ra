import { NextRequest, NextResponse } from "next/server";
import { V3RAPointsService } from "@/lib/services/v3ra-points";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { prisma } from "@/lib/db/client";
import { rateLimitRelaxed } from "@/lib/middleware/rate-limit";
import { ensureUserExists } from "@/lib/auth/ensure-user";

export const GET = rateLimitRelaxed(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");
    let userEmail = "";
    
    // Check headers from middleware first
    const headerUserId = request.headers.get('x-user-id');
    const headerUserEmail = request.headers.get('x-user-email');
    
    if (!userId && headerUserId) {
      userId = headerUserId;
      userEmail = headerUserEmail || "";
    }
    
    if (!userId) {
      // Try to get from session
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json(
          { error: "User not authenticated" },
          { status: 401 }
        );
      }
      
      userId = user.id;
      userEmail = user.email || "";
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
    const userPoints = await V3RAPointsService.getUserPoints(userId);
    
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
    
    return NextResponse.json({
      userId,
      balance: Number(userPoints.balance),
      totalEarned: Number(userPoints.totalEarned),
      totalSpent: Number(userPoints.totalSpent),
      streak: userPoints.streak,
      level: userPoints.level,
      history
    });
    
  } catch (error) {
    console.error("Get user points error:", error);
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