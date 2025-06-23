import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "models"; // models, questions, or overview

    if (type === "models") {
      // Get model performance leaderboard
      const { data: modelStats, error } = await supabase
        .from("model_arena_stats")
        .select("*")
        .order("win_rate", { ascending: false })
        .order("total_selections", { ascending: false });

      if (error) {
        console.error("Error fetching model stats:", error);
        return NextResponse.json({ error: "Failed to fetch model stats" }, { status: 500 });
      }

      return NextResponse.json({
        models: modelStats || [],
        type: "models"
      });

    } else if (type === "questions") {
      // Get question controversy and consensus stats
      const { data: questionStats, error } = await supabase
        .from("question_arena_stats")
        .select(`
          *,
          vote_sessions!inner(
            query_text,
            created_at
          )
        `)
        .order("controversy_score", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching question stats:", error);
        return NextResponse.json({ error: "Failed to fetch question stats" }, { status: 500 });
      }

      return NextResponse.json({
        questions: questionStats || [],
        type: "questions"
      });

    } else if (type === "overview") {
      // Get overall Truth Arena statistics
      const { data: totalRefinements } = await supabase
        .from("truth_refinements")
        .select("id", { count: "exact" });

      const { data: totalQuestions } = await supabase
        .from("question_arena_stats")
        .select("id", { count: "exact" });

      const { data: activeSessions } = await supabase
        .from("truth_refinement_sessions")
        .select("id", { count: "exact" })
        .gte("session_start", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: topModel } = await supabase
        .from("model_arena_stats")
        .select("model_name, provider, win_rate, total_selections")
        .order("win_rate", { ascending: false })
        .order("total_selections", { ascending: false })
        .limit(1);

      const { data: mostControversial } = await supabase
        .from("question_arena_stats")
        .select(`
          controversy_score,
          vote_sessions!inner(query_text)
        `)
        .order("controversy_score", { ascending: false })
        .limit(1);

      return NextResponse.json({
        overview: {
          totalRefinements: totalRefinements?.length || 0,
          totalQuestions: totalQuestions?.length || 0,
          activeSessions24h: activeSessions?.length || 0,
          topPerformingModel: topModel?.[0] || null,
          mostControversialQuestion: mostControversial?.[0] || null
        },
        type: "overview"
      });

    } else {
      return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
    }

  } catch (error) {
    console.error("Truth Arena stats API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}