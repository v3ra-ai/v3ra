import { NextRequest, NextResponse } from "next/server";
import { V3RAPointsService } from "@/lib/services/v3ra-points";
import { createSupabaseServerClient } from "@/lib/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
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
      
      const userPoints = await V3RAPointsService.getUserPoints(user.id);
      return NextResponse.json({
        userId: user.id,
        balance: Number(userPoints.balance),
        totalEarned: Number(userPoints.totalEarned),
        totalSpent: Number(userPoints.totalSpent),
        streak: userPoints.streak,
        level: userPoints.level
      });
    }
    
    const userPoints = await V3RAPointsService.getUserPoints(userId);
    
    return NextResponse.json({
      userId,
      balance: Number(userPoints.balance),
      totalEarned: Number(userPoints.totalEarned),
      totalSpent: Number(userPoints.totalSpent),
      streak: userPoints.streak,
      level: userPoints.level
    });
    
  } catch (error) {
    console.error("Get user points error:", error);
    return NextResponse.json(
      { error: "Failed to get user points" },
      { status: 500 }
    );
  }
}