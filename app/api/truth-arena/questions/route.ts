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
      .from("VoteSession")
      .select(`
        id,
        queryText,
        createdAt,
        ValidatorResponse (
          id,
          validatorId,
          vote,
          rationale,
          Validator (
            profileName,
            provider
          )
        )
      `)
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching arena questions:", error);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    // Filter out questions without enough responses and format for arena
    const arenaQuestions = questions
      ?.map(question => ({
        id: question.id,
        question: question.queryText,
        responses: question.ValidatorResponse
          .filter(response => {
            // Filter out API error responses
            const rationale = response.rationale || "";
            return !rationale.includes("API request failed") && 
                   !rationale.includes("not a valid model") &&
                   rationale.length > 15;
          })
          .map((response: {id: string; vote: string; rationale: string; Validator: {profileName: string; provider: string}[]}) => ({
            id: response.id,
            modelName: response.Validator?.[0]?.profileName || "Unknown Model",
            answer: response.vote || "UNKNOWN",
            rationale: response.rationale || "No rationale provided", 
            provider: response.Validator?.[0]?.provider || "Unknown Provider"
          })),
        // Count how many users have already refined this question
        userVotes: 0 // Will be populated by a separate query
      }))
      ?.filter(question => question.responses.length >= 1) || []; // Keep questions with at least 1 valid response

    // TODO: Get refinement counts for these questions when stats table is available
    // For now, set userVotes to 0 for all questions
    arenaQuestions.forEach(question => {
      question.userVotes = 0;
    });

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