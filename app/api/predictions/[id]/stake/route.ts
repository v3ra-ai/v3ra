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
    
    const { amount } = await request.json();
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid stake amount" },
        { status: 400 }
      );
    }

    // First, ensure market exists
    let market = await PredictionMarketService.getMarketDetails(params.id);
    
    if (!market) {
      // Get the prediction to create market
      const { prisma } = await import("@/lib/db/client");
      const prediction = await prisma.prediction.findUnique({
        where: { id: params.id },
        include: { outcomes: true }
      });
      
      if (!prediction || !prediction.outcomes[0]) {
        return NextResponse.json(
          { error: "Prediction not found" },
          { status: 404 }
        );
      }
      
      // Create market with initial probability
      const initialProb = (prediction.outcomes[0].consensusProbability?.toNumber() || 0.5) * 100;
      await PredictionMarketService.createMarket(params.id, userId, initialProb);
    }

    // Stake to market
    const updatedMarket = await PredictionMarketService.stakeToMarket(
      params.id,
      userId,
      amount
    );

    return NextResponse.json({ 
      success: true,
      market: updatedMarket
    });
  } catch (error: any) {
    console.error("Error staking to market:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stake" },
      { status: 400 }
    );
  }
}