import { NextRequest, NextResponse } from "next/server";
import { PredictionMarketService } from "@/lib/services/prediction-market";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { ApiError, ErrorCode, errorResponse, validate } from "@/lib/utils/api-errors";
import { rateLimitNormal } from "@/lib/middleware/rate-limit";

const handler = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const params = await context.params;
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new ApiError('UNAUTHORIZED');
    }
    
    const body = await request.json();
    
    // Validate inputs
    const position = validate.enum(body.position, ['YES', 'NO'], 'position') as 'YES' | 'NO';
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
    return errorResponse("Internal server error", ErrorCode.INTERNAL_SERVER_ERROR, 500, error);
  }
};

export const POST = (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => rateLimitNormal(() => handler(request, context))(request);