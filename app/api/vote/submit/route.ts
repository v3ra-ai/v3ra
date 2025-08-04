import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { withCSRFProtection } from '@/lib/middleware/csrf';
import { rateLimitModerate } from '@/lib/rate-limit/index';
import { voteSubmitSchema, validateRequestBody } from '@/lib/validation/schemas';
import { invalidateUserCache, invalidateAnalyticsCache, invalidateLeaderboardCache } from '@/lib/cache/cache-utils';
import { apiLogger } from '@/lib/logger';

// Helper to safely serialize objects that may contain BigInt values
function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? Number(value) : value))
  );
}

export const POST = rateLimitModerate(withCSRFProtection(async (request: NextRequest) => {
  try {
    const supabase = await createSupabaseServerClient();
    
    // First check the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      apiLogger.error('Session retrieval error', { error: sessionError.message });
    }
    
    // Then get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      apiLogger.error('User retrieval error', { error: userError.message });
    }
    
    // Log authentication state for debugging
    apiLogger.info('Auth state in vote submission', {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      sessionUser: session?.user?.id,
      cookies: request.cookies.getAll().filter(c => c.name.includes('sb-')).map(c => ({ name: c.name, hasValue: !!c.value }))
    });
    
    // For now, create a guest user ID if not authenticated
    // This allows voting without login but won't persist points
    const userId = user?.id || `guest-${request.headers.get('x-forwarded-for') || 'anonymous'}`;
    const isGuest = !user;

    // Validate request body with Zod
    const { data: validatedData, error: validationError } = await validateRequestBody(
      request,
      voteSubmitSchema
    );
    
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const {
      voteSessionId,
      winningValidatorId,
      losingValidatorId,
      voteReason,
      voteStrength,
      timeToDecide
    } = validatedData!;

    // Check if authentication is required (for now, require auth)
    if (isGuest) {
      apiLogger.warn('Unauthenticated vote attempt', {
        headers: Object.fromEntries(request.headers.entries()),
        hasCSRFToken: !!request.headers.get('x-csrf-token')
      });
      
      return NextResponse.json(
        { error: 'Authentication required to vote' },
        { status: 401 }
      );
    }

    // Use secure server-side function for vote submission (authenticated users only)
    const { data: voteResult, error: voteError } = await supabase
      .rpc('submit_vote_with_reward', {
        p_vote_session_id: voteSessionId,
        p_user_id: user!.id,
        p_winning_validator_id: winningValidatorId,
        p_losing_validator_id: losingValidatorId,
        p_vote_reason: voteReason,
        p_vote_strength: voteStrength,
        p_time_to_decide: timeToDecide || 0
      });

    if (voteError) {
      // Log detailed error information
      apiLogger.error('Vote submission RPC error', {
        error: voteError.message,
        code: voteError.code,
        details: voteError.details,
        hint: voteError.hint,
        params: {
          p_vote_session_id: voteSessionId,
          p_user_id: user.id,
          p_winning_validator_id: winningValidatorId,
          p_losing_validator_id: losingValidatorId,
          p_vote_reason: voteReason,
          p_vote_strength: voteStrength,
          p_time_to_decide: timeToDecide || 0
        }
      });
      
      // Check for duplicate vote error
      if (voteError.message?.includes('already voted')) {
        return NextResponse.json(
          { error: 'You have already voted on this comparison' },
          { status: 400 }
        );
      }
      
      // Return more detailed error in development
      const errorResponse = process.env.NODE_ENV === 'development' 
        ? {
            error: voteError.message || 'Vote submission failed',
            code: voteError.code,
            hint: voteError.hint
          }
        : { error: voteError.message || 'Vote submission failed' };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!voteResult || voteResult.length === 0) {
      throw new Error('No result returned from vote submission');
    }

    const voteData = voteResult[0];

    // 2. Update model matchups
    const [modelA, modelB] = [winningValidatorId, losingValidatorId].sort();
    const isModelAWinner = modelA === winningValidatorId;

    const { error: matchupError } = await supabase
      .rpc('update_model_matchup', {
        p_model_a: modelA,
        p_model_b: modelB,
        p_category: voteReason,
        p_model_a_won: isModelAWinner
      });

    if (matchupError) {
      // Only ignore if function doesn't exist (backwards compatibility)
      if (!matchupError.message?.includes('function does not exist')) {
        apiLogger.error('Critical: Matchup update failed', {
          error: matchupError.message,
          code: matchupError.code,
          winningModel: winningValidatorId,
          losingModel: losingValidatorId,
          category: voteReason
        });
        // Note: Sentry should be configured server-side, not using window object
        // Don't fail the entire request, but log this critical error
      }
    }

    // 3. Update Elo ratings
    let eloData = null;
    const { data: eloResult, error: eloError } = await supabase
      .rpc('update_elo_ratings', {
        p_winner_id: winningValidatorId,
        p_loser_id: losingValidatorId,
        p_category: voteReason
      });

    if (eloError) {
      // Only ignore if function doesn't exist (backwards compatibility)
      if (!eloError.message?.includes('function does not exist')) {
        apiLogger.error('Critical: Elo update failed', {
          error: eloError.message,
          code: eloError.code,
          winningModel: winningValidatorId,
          losingModel: losingValidatorId,
          category: voteReason
        });
        // Note: Sentry should be configured server-side, not using window object
        // Continue without Elo data rather than failing the entire request
      }
    } else {
      eloData = eloResult;
    }

    // Invalidate relevant caches after successful vote
    invalidateUserCache(user.id);
    invalidateAnalyticsCache();
    
    // Invalidate leaderboard if points changed significantly
    if (Number(voteData.scratch_card_reward) > 0) {
      invalidateLeaderboardCache();
    }
    
    // Return the secure server-calculated values
    const responseBody = serializeBigInt({
      success: true,
      scratchCardReward: Number(voteData.scratch_card_reward),
      newUserPoints: Number(voteData.new_balance),
      currentStreak: Number(voteData.current_streak),
      eloChanges: eloData ? serializeBigInt(eloData[0]) : null,
      voteId: voteData.vote_id as string,
    });

    return NextResponse.json(responseBody);

  } catch (error) {
    apiLogger.error('Vote submission failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: '/api/vote/submit'
    });
    
    // Provide more detailed error information in development
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit vote';
    const errorDetails = process.env.NODE_ENV === 'development' ? {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    } : {
      error: 'Failed to submit vote'
    };
    
    return NextResponse.json(
      errorDetails,
      { status: 500 }
    );
  }
}));