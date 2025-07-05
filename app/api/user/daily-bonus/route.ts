import { NextRequest, NextResponse } from "next/server";
import { V3RAPointsService } from "@/lib/services/v3ra-points";
import { createSupabaseServerClient } from "@/lib/supabase-client";

export async function POST(request: NextRequest) {
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
      const bonusAmount = await V3RAPointsService.claimDailyBonus(actualUserId);
      const userPoints = await V3RAPointsService.getUserPoints(actualUserId);
      
      return NextResponse.json({
        success: true,
        newBalance: Number(userPoints.balance),
        awarded: bonusAmount,
        streak: userPoints.streak
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
    console.error("Daily bonus error:", error);
    return NextResponse.json(
      { error: "Failed to process daily bonus" },
      { status: 500 }
    );
  }
}