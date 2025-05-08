import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastCustomQuery } from "@/app/actions";
import { verifyCsrfToken } from "@/utils/csrf-utils";

const querySchema = z.object({
  queryText: z
    .string()
    .min(1, "Query text is required")
    .max(500, "Query text must not exceed 500 characters")
    .trim()
    .refine(
      (value) => !/[<>;]/.test(value),
      "Query text contains invalid characters (e.g., <, >, ;)",
    ),
  queryMode: z.enum(["factCheck", "predict", "create", "shop"]).default("factCheck"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("[Broadcast] Failed to parse request body:", error);
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: {
          message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 400 },
    );
  }

  console.log("Received request to /api/broadcast-query", {
    headers: Object.fromEntries(request.headers),
    body,
  });

  const csrfResponse = verifyCsrfToken(request);
  if (csrfResponse) {
    return csrfResponse;
  }

  try {
    const { queryText, queryMode } = querySchema.parse(body);
    console.log("Validated queryText:", queryText, "queryMode:", queryMode);
    const result = await broadcastCustomQuery(queryText, queryMode);
    console.log("Broadcast result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Broadcast] Error in broadcast API:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      queryText: body && typeof body === "object" && "queryText" in body ? body.queryText : null,
      queryMode: body && typeof body === "object" && "queryMode" in body ? body.queryMode : null,
    });
    return NextResponse.json(
      {
        error: error instanceof z.ZodError ? "Invalid query input" : "Failed to broadcast query",
        details: error instanceof z.ZodError
          ? error.errors
          : { message: error instanceof Error ? error.message : "Unknown error" },
      },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}