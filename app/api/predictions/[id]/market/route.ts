import { NextResponse } from "next/server";
import { PredictionMarketService } from "@/lib/services/prediction-market";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { rateLimitNormal } from "@/lib/middleware/rate-limit";

export const GET = rateLimitNormal(async (
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const market = await PredictionMarketService.getMarketDetails(params.id);
    
    // If no market exists yet, return null
    if (!market) {
      return NextResponse.json({ market: null });
    }

    return NextResponse.json({ market });
  } catch (error) {
    console.error("Error fetching market:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}

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
    
    const body = await request.json();
    const { initialProbability } = body;

    // Create market if it doesn't exist
    const market = await PredictionMarketService.createMarket(
      params.id,
      user.id,
      initialProbability
    );

    return NextResponse.json({ market });
  } catch (error: any) {
    console.error("Error creating market:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create market" },
      { status: 400 }
    );
  }
});