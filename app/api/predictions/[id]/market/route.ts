import { NextResponse } from "next/server";
import { PredictionMarketService } from "@/lib/services/prediction-market";
import { cookies } from "next/headers";

export async function GET(
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

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("demo_user_id")?.value || "demo-user-1";
    
    const body = await request.json();
    const { initialProbability } = body;

    // Create market if it doesn't exist
    const market = await PredictionMarketService.createMarket(
      params.id,
      userId,
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
}