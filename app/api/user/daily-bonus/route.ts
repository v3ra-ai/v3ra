import { NextRequest, NextResponse } from "next/server";
import { V3RAPointsService } from "@/lib/services/v3ra-points";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { rateLimitNormal } from "@/lib/middleware/rate-limit";
import { withCSRFProtection } from "@/lib/middleware/csrf";
import { apiLogger } from "@/lib/logger";

export const POST = rateLimitNormal(withCSRFProtection(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { userId, type, amount } = body;
    
    // Verify user is authenticated
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || (userId && user.id !== userId)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const actualUserId = userId || user.id;
    
    // For Headlines completion bonus
    if (type === 'HEADLINES_COMPLETION') {
      const userPoints = await V3RAPointsService.awardPoints(
        actualUserId,
        amount || 50,
        'DAILY_BONUS',
        'Headlines daily completion bonus'
      );
      
      return NextResponse.json({
        success: true,
        newBalance: Number(userPoints.balance),
        awarded: amount || 50
      });
    }
    
    // For regular daily bonus
    try {
      const result = await V3RAPointsService.claimDailyBonus(actualUserId);
      
      return NextResponse.json({
        success: true,
        newBalance: Number(result.newBalance),
        awarded: result.awarded,
        streak: result.streak
      });
    } catch (error: any) {
      if (error.message === "Daily bonus already claimed") {
        return NextResponse.json(
          { error: "Daily bonus already claimed" },
          { status: 400 }
        );
      }
      throw error;
    }
    
  } catch (error) {
    apiLogger.error("Failed to process daily bonus", { error });
    return NextResponse.json(
      { error: "Failed to process daily bonus" },
      { status: 500 }
    );
  }
}));