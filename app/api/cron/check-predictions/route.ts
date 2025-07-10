import { NextResponse } from "next/server";
import { PredictionResolver } from "@/lib/services/prediction-resolver";
import { rateLimitRelaxed } from "@/lib/middleware/rate-limit";

export const GET = rateLimitRelaxed(async (request: Request) => {
  try {
    // Verify this is from a cron job (in production, check secret/auth)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolver = new PredictionResolver();
    await resolver.checkPendingPredictions();

    return NextResponse.json({ success: true, message: "Predictions checked" });
  } catch (error) {
    console.error("Error in prediction cron job:", error);
    return NextResponse.json(
      { error: "Failed to check predictions" },
      { status: 500 }
    );
  }
});