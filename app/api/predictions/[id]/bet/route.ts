import { NextResponse } from "next/server";
import { PredictionMarketService } from "@/lib/services/prediction-market";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { ApiError, errorResponse, validate } from "@/lib/utils/api-errors";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new ApiError('UNAUTHORIZED');
    }
    
    const body = await request.json();
    
    // Validate inputs
    const position = validate.enum(body.position, ['YES', 'NO'], 'position');
    const amount = validate.positiveNumber(body.amount, 'amount');

    // Place bet
    const bet = await PredictionMarketService.placeBet(
      params.id,
      user.id,
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
  } catch (error) {
    return errorResponse(error);
  }
}