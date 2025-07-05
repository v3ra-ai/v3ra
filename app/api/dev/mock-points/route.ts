import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for development
const mockPointsStore = new Map<string, number>();

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "demo-user";
  
  // Get or create mock balance
  if (!mockPointsStore.has(userId)) {
    mockPointsStore.set(userId, 1000); // Default balance
  }
  
  const balance = mockPointsStore.get(userId) || 0;
  
  return NextResponse.json({
    userId,
    balance,
    totalEarned: balance,
    totalSpent: 0,
    streak: 1,
    level: 1
  });
}

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
    const { amount = 5000, userId = "demo-user" } = body;
    
    // Get current balance
    const currentBalance = mockPointsStore.get(userId) || 0;
    const newBalance = currentBalance + amount;
    
    // Update balance
    mockPointsStore.set(userId, newBalance);
    
    return NextResponse.json({
      success: true,
      newBalance,
      awarded: amount,
      message: `Added ${amount} V3RA to your account!`
    });
    
  } catch (error) {
    console.error("Mock add points error:", error);
    return NextResponse.json(
      { error: "Failed to add points" },
      { status: 500 }
    );
  }
}