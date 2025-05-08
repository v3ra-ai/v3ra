
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastCustomQuery } from "@/app/actions";
// import { QueryMode } from "@/lib/types";

const broadcastQuerySchema = z.object({
  queryText: z.string().min(1, "Query text is required"),
  queryMode: z.enum(["factCheck", "predict", "create", "shop"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[broadcast-query] Received request body:", body); // Log incoming body

    const parsedBody = broadcastQuerySchema.safeParse(body);
    if (!parsedBody.success) {
      console.error("[broadcast-query] Validation failed:", parsedBody.error.format()); // Log validation errors
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.format() },
        { status: 400 }
      );
    }

    console.log("[broadcast-query] Parsed body:", parsedBody.data); // Log parsed data

    const { queryText, queryMode } = parsedBody.data;
    const result = await broadcastCustomQuery(queryText, queryMode);

    console.log("[broadcast-query] broadcastCustomQuery result:", result); // Log result

    if ("error" in result) {
      console.error("[broadcast-query] Error from broadcastCustomQuery:", result.error); // Log error
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("[broadcast-query] Unexpected error:", error); // Log unexpected errors
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}