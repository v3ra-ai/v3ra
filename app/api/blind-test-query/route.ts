import { NextRequest, NextResponse } from "next/server";
import { getBlindTestComparison } from "@/app/actions-blind-test";
import { rateLimitNormal } from "@/lib/middleware/rate-limit";
import { blindTestQuerySchema, validateRequestBody } from "@/lib/validation/schemas";

// This endpoint is read-only (no state change), so CSRF protection is unnecessary
export const POST = rateLimitNormal(async (request: NextRequest) => {
  try {
    // Validate request body with Zod
    const { data: validatedData, error: validationError } = await validateRequestBody(
      request,
      blindTestQuerySchema
    );
    
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const { queryText, pairingStrategy } = validatedData!;

    // Ensure pairingStrategy matches expected enum type
    const strategy = pairingStrategy as typeof pairingStrategy & ("SMART" | "UNDERDOG" | "TITANS" | "OPEN_SOURCE");

    const result = await getBlindTestComparison(queryText, strategy);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});