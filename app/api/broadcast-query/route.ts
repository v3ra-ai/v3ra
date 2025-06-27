import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastCustomQuery } from "@/app/actions";
import rateLimit from "@/lib/rate-limit";

const _limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});


const broadcastQuerySchema = z.object({
  queryText: z.string().min(1, "Query text is required"),
  queryMode: z.enum(["fact-check"]).optional(),
  queriesRequested: z.number().int().min(1).optional(),
  selectedLLMIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsedBody = broadcastQuerySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    const { queryText, queryMode, queriesRequested, selectedLLMIds } = parsedBody.data;

    if (selectedLLMIds && selectedLLMIds.length > 0 && queriesRequested && queriesRequested > selectedLLMIds.length) {
      return NextResponse.json(
        { error: `Cannot query ${queriesRequested} AIs when only ${selectedLLMIds.length} are selected.` },
        { status: 400 }
      );
    }

    const result = await broadcastCustomQuery(queryText, queryMode, queriesRequested, selectedLLMIds);


    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}