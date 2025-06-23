import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const excludeIds = searchParams.get("exclude")?.split(",") || [];

    // Fetch vote sessions that have multiple validator responses
    // These are the questions that can be refined
    const { data: questions, error } = await supabase
      .from("vote_sessions")
      .select(`
        id,
        query_text,
        created_at,
        validator_responses (
          id,
          profile_name,
          provider,
          vote,
          rationale
        )
      `)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .gte("validator_responses.count", 2) // Only questions with multiple responses
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching arena questions:", error);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    // Filter out questions without enough responses and format for arena
    const arenaQuestions = questions
      ?.filter(q => q.validator_responses && q.validator_responses.length >= 2)
      .map(question => ({
        id: question.id,
        question: question.query_text,
        responses: question.validator_responses.map(response => ({
          id: response.id,
          modelName: response.profile_name,
          answer: response.vote || "UNKNOWN",
          rationale: response.rationale || "No rationale provided",
          provider: response.provider
        })),
        // Count how many users have already refined this question
        userVotes: 0 // Will be populated by a separate query
      })) || [];

    // Get refinement counts for these questions
    if (arenaQuestions.length > 0) {
      const questionIds = arenaQuestions.map(q => q.id);
      const { data: refinementCounts } = await supabase
        .from("question_arena_stats")
        .select("vote_session_id, total_refinements")
        .in("vote_session_id", questionIds);

      // Add refinement counts to questions
      arenaQuestions.forEach(question => {
        const stats = refinementCounts?.find(stat => stat.vote_session_id === question.id);
        question.userVotes = stats?.total_refinements || 0;
      });
    }

    return NextResponse.json({
      questions: arenaQuestions,
      total: arenaQuestions.length
    });

  } catch (error) {
    console.error("Truth Arena questions API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}