import { NextRequest, NextResponse } from "next/server";

// Mock endpoint for development
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'demo-user';
  
  // Return mock user points
  return NextResponse.json({
    userId,
    balance: 1000,
    streak: 1,
    totalEarned: 1000,
    totalSpent: 0,
    history: []
  });
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  try {
    const body = await request.json();
    const { amount, userId } = body;
    
    // Mock response
    return NextResponse.json({
      success: true,
      userId: userId || 'demo-user',
      amount: amount || 50,
      newBalance: 1000 + (amount || 50),
      message: `Added ${amount || 50} V3RA points`
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}