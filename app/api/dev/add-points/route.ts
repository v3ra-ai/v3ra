import { NextRequest, NextResponse } from "next/server";
import { V3RAPointsService } from "@/lib/services/v3ra-points";
import { createSupabaseServerClient } from "@/lib/supabase-client";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { amount = 5000 } = body;
    
    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    // Award points
    const userPoints = await V3RAPointsService.awardPoints(
      user.id,
      amount,
      'DEV_GRANT',
      `Development testing grant: ${amount} V3RA`
    );
    
    return NextResponse.json({
      success: true,
      newBalance: Number(userPoints.balance),
      awarded: amount,
      message: `Added ${amount} V3RA to your account!`
    });
    
  } catch (error) {
    console.error("Dev add points error:", error);
    return NextResponse.json(
      { error: "Failed to add points" },
      { status: 500 }
    );
  }
}