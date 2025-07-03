import { NextResponse } from "next/server";
import { PredictionMarketService } from "@/lib/services/prediction-market";
import { cookies } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("demo_user_id")?.value || "demo-user-1";
    
    const { position, amount } = await request.json();
    
    if (!position || !["YES", "NO"].includes(position)) {
      return NextResponse.json(
        { error: "Invalid position. Must be YES or NO" },
        { status: 400 }
      );
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid bet amount" },
        { status: 400 }
      );
    }

    // Place bet
    const bet = await PredictionMarketService.placeBet(
      params.id,
      userId,
      position,
      amount
    );

    return NextResponse.json({ 
      success: true,
      bet: {
        id: bet.id,
        position: bet.position,
        amount: bet.amount.toNumber(),
        odds: bet.odds.toNumber(),
        potentialReturn: bet.potentialReturn.toNumber(),
      }
    });
  } catch (error: any) {
    console.error("Error placing bet:", error);
    return NextResponse.json(
      { error: error.message || "Failed to place bet" },
      { status: 400 }
    );
  }
}