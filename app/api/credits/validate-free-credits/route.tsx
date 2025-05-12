import { NextResponse } from "next/server";
import { USER_FREE_CREDITS_DEFAULT } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { freeCredits, lastResetDate } = body;

    // Validate input
    if (typeof freeCredits !== "number" || freeCredits < 0) {
      console.warn("[validate-free-credits] Invalid freeCredits:", { freeCredits });
      return NextResponse.json(
        { freeCredits: USER_FREE_CREDITS_DEFAULT },
        { status: 400 }
      );
    }
    if (typeof lastResetDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(lastResetDate)) {
      console.warn("[validate-free-credits] Invalid lastResetDate:", { lastResetDate });
      return NextResponse.json(
        { freeCredits: USER_FREE_CREDITS_DEFAULT },
        { status: 400 }
      );
    }

    // Get server-side max free credits from environment variable
    const maxFreeCredits = parseInt(process.env.MAX_FREE_CREDITS || "10", 10);
    if (isNaN(maxFreeCredits) || maxFreeCredits < 0) {
      console.error("[validate-free-credits] Invalid MAX_FREE_CREDITS:", process.env.MAX_FREE_CREDITS);
      return NextResponse.json(
        { freeCredits: USER_FREE_CREDITS_DEFAULT },
        { status: 500 }
      );
    }

    // Cap freeCredits to MAX_FREE_CREDITS
    const validatedFreeCredits = Math.min(freeCredits, maxFreeCredits);
    if (freeCredits > maxFreeCredits) {
      console.warn("[validate-free-credits] Detected tampering, capping credits:", {
        original: freeCredits,
        capped: validatedFreeCredits,
      });
    }

    console.log("[validate-free-credits] Validated:", {
      freeCredits: validatedFreeCredits,
      lastResetDate,
    });

    return NextResponse.json({ freeCredits: validatedFreeCredits });
  } catch (error) {
    console.error("[validate-free-credits] Error:", error);
    return NextResponse.json(
      { freeCredits: USER_FREE_CREDITS_DEFAULT },
      { status: 500 }
    );
  }
}