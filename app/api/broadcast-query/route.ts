import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastCustomQuery } from "@/app/actions";

// Log to confirm file is loaded
console.log("[broadcast-query] File loaded");

const broadcastQuerySchema = z.object({
  queryText: z.string().min(1, "Query text is required"),
  queryMode: z.enum(["fact-check"]).optional(),
  queriesRequested: z.number().int().min(1).optional(),
  selectedLLMIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[broadcast-query] Received request body:", {
      queryText: body.queryText,
      queryMode: body.queryMode,
      queriesRequested: body.queriesRequested,
      selectedLLMIds: body.selectedLLMIds || "none",
    });

    const parsedBody = broadcastQuerySchema.safeParse(body);
    if (!parsedBody.success) {
      console.error("[broadcast-query] Validation failed:", parsedBody.error.format());
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const { queryText, queryMode, queriesRequested, selectedLLMIds } = parsedBody.data;

    if (selectedLLMIds && selectedLLMIds.length > 0 && queriesRequested && queriesRequested > selectedLLMIds.length) {
      console.error("[broadcast-query] Queries requested exceeds selected LLMs:", {
        queriesRequested,
        selectedLLMCount: selectedLLMIds.length,
      });
      return NextResponse.json(
        { error: `Cannot query ${queriesRequested} AIs when only ${selectedLLMIds.length} are selected.` },
        { status: 400 }
      );
    }

    const result = await broadcastCustomQuery(queryText, queryMode, queriesRequested, selectedLLMIds);

    console.log("[broadcast-query] broadcastCustomQuery result:", result);

    if ("error" in result) {
      console.error("[broadcast-query] Error from broadcastCustomQuery:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("[broadcast-query] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}