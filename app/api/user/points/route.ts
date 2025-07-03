import { NextResponse } from "next/server";
import { V3RAPointsService } from "@/lib/services/v3ra-points";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // For demo, use a consistent user ID from cookie
    const cookieStore = cookies();
    let userId = cookieStore.get("demo_user_id")?.value;
    
    // If no user ID, create one and set cookie
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      // Note: In Next.js 13+ with app router, we can't set cookies in GET requests
      // So we'll use the default demo-user-1 for now
      userId = "demo-user-1";
    }

    const userPoints = await V3RAPointsService.getUserPoints(userId);
    const canClaimBonus = await V3RAPointsService.checkDailyBonus(userId);

    return NextResponse.json({
      balance: userPoints.balance.toNumber(),
      totalEarned: userPoints.totalEarned.toNumber(),
      totalSpent: userPoints.totalSpent.toNumber(),
      level: userPoints.level,
      streak: userPoints.streak,
      canClaimDailyBonus: canClaimBonus,
    });
  } catch (error) {
    console.error("Error fetching user points:", error);
    return NextResponse.json(
      { error: "Failed to fetch user points" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("demo_user_id")?.value || "demo-user-1";

    const { action } = await request.json();

    if (action === "claimDailyBonus") {
      const bonus = await V3RAPointsService.claimDailyBonus(userId);
      return NextResponse.json({ success: true, bonus });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error processing points action:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process action" },
      { status: 400 }
    );
  }
}