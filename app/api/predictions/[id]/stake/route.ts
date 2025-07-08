import { NextResponse } from "next/server";
import { PredictionMarketService } from "@/lib/services/prediction-market";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { rateLimitNormal } from "@/lib/middleware/rate-limit";

export const POST = rateLimitNormal(async (
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
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
      await PredictionMarketService.createMarket(params.id, user.id, initialProb);
    }

    // Stake to market
    const updatedMarket = await PredictionMarketService.stakeToMarket(
      params.id,
      user.id,
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
});