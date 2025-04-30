import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastCustomQuery } from "@/app/actions";
import { verifyCsrfToken } from "@/utils/csrf-utils";

// Define Zod schema for query validation
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
});

// Broadcasts a query to validators and returns the vote result
export async function POST(request: NextRequest) {
  // Verify CSRF token
  const csrfResponse = verifyCsrfToken(request);
  if (csrfResponse) {
    return csrfResponse;
  }

  try {
    // Parse and validate request body
    const { queryText } = querySchema.parse(await request.json());

    const result = await broadcastCustomQuery(queryText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Broadcast] Error in broadcast API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? "Invalid query input"
            : "Failed to broadcast query",
        details: error instanceof z.ZodError ? error.errors : undefined,
      },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}