import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      voteSessionId,
      questionText,
      selectedResponseId,
      selectedModelName,
      selectedProvider,
      selectedAnswer,
      responseTimeMs,
      userEmail,
      userWallet
    } = body;

    // Validate required fields
    if (!voteSessionId || !selectedResponseId || !selectedModelName || !questionText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Record the refinement
    const { data: refinement, error: refinementError } = await supabase
      .from("truth_refinements")
      .insert([
        {
          session_id: sessionId,
          vote_session_id: voteSessionId,
          question_text: questionText,
          selected_response_id: selectedResponseId,
          selected_model_name: selectedModelName,
          selected_provider: selectedProvider,
          selected_answer: selectedAnswer,
          response_time_ms: responseTimeMs || null
        }
      ])
      .select()
      .single();

    if (refinementError) {
      console.error("Error recording refinement:", refinementError);
      return NextResponse.json(
        { error: "Failed to record refinement" },
        { status: 500 }
      );
    }

    // Calculate agreement percentage for this choice
    const { data: sameChoices } = await supabase
      .from("truth_refinements")
      .select("id")
      .eq("vote_session_id", voteSessionId)
      .eq("selected_response_id", selectedResponseId);

    const { data: totalChoices } = await supabase
      .from("truth_refinements")
      .select("id")
      .eq("vote_session_id", voteSessionId);

    const agreementPercent = totalChoices && totalChoices.length > 0
      ? Math.round(((sameChoices?.length || 0) / totalChoices.length) * 100)
      : 100; // If this is the first choice, it's 100% agreement

    // Update the refinement with agreement percentage
    await supabase
      .from("truth_refinements")
      .update({ agreement_percent: agreementPercent })
      .eq("id", refinement.id);

    // Update session if provided
    if (sessionId) {
      // First get current count, then increment
      const { data: currentSession } = await supabase
        .from("truth_refinement_sessions")
        .select("questions_refined")
        .eq("id", sessionId)
        .single();
      
      await supabase
        .from("truth_refinement_sessions")
        .update({ 
          questions_refined: (currentSession?.questions_refined || 0) + 1,
          session_end: new Date().toISOString()
        })
        .eq("id", sessionId);
    }

    // Get current model performance
    const { data: modelStats } = await supabase
      .from("model_arena_stats")
      .select("*")
      .eq("model_name", selectedModelName)
      .eq("provider", selectedProvider)
      .single();

    return NextResponse.json({
      success: true,
      agreementPercent,
      refinementId: refinement.id,
      modelStats: modelStats ? {
        winRate: modelStats.win_rate,
        totalSelections: modelStats.total_selections,
        totalAppearances: modelStats.total_appearances
      } : null
    });

  } catch (error) {
    console.error("Truth Arena refine API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Start a new refinement session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, userWallet, streakCount } = body;

    const { data: session, error } = await supabase
      .from("truth_refinement_sessions")
      .insert([
        {
          user_email: userEmail || null,
          user_wallet: userWallet || null,
          streak_count: streakCount || 0,
          session_start: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      success: true
    });

  } catch (error) {
    console.error("Truth Arena session API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}