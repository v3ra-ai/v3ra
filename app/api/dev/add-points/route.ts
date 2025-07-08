import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { prisma } from "@/lib/db/client";
import { Decimal } from "@prisma/client/runtime/library";

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
    
    // For development, we'll use a simpler approach
    // Check if user has points record
    let userPoints = await prisma.userPoints.findUnique({
      where: { userId: user.id }
    });
    
    if (!userPoints) {
      // Check if user exists in database first
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!dbUser) {
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }
      
      // Create new points record
      userPoints = await prisma.userPoints.create({
        data: {
          userId: user.id,
          balance: new Decimal(amount),
          totalEarned: new Decimal(amount),
          totalSpent: new Decimal(0),
          level: 1,
          streak: 0
        }
      });
    } else {
      // Update existing balance
      userPoints = await prisma.userPoints.update({
        where: { userId: user.id },
        data: {
          balance: userPoints.balance.plus(amount),
          totalEarned: userPoints.totalEarned.plus(amount)
        }
      });
    }
    
    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: user.id,
        type: 'DEV_GRANT',
        amount: new Decimal(amount),
        balance: userPoints.balance,
        description: `Development testing grant: ${amount} V3RA`
      }
    });
    
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