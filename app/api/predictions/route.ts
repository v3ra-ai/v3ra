import { NextResponse } from "next/server";
import { PredictionTracker } from "@/lib/services/prediction-tracker";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    const tracker = new PredictionTracker();
    let predictions;

    if (status === "pending") {
      predictions = await tracker.getPendingPredictions();
    } else if (status === "resolved") {
      predictions = await tracker.getResolvedPredictions(limit);
    } else if (category) {
      predictions = await tracker.getPredictionsByCategory(category, limit);
    } else {
      return NextResponse.json({ error: "Invalid status parameter" }, { status: 400 });
    }

    // Convert Decimal types to numbers for JSON serialization
    const serializedPredictions = predictions.map(pred => ({
      ...pred,
      outcomes: pred.outcomes.map(outcome => ({
        ...outcome,
        consensusProbability: outcome.consensusProbability ? Number(outcome.consensusProbability) : 0,
        modelAgreement: outcome.modelAgreement ? Number(outcome.modelAgreement) : 0,
      })),
      resolutions: pred.resolutions?.map(res => ({
        ...res,
        confidenceScore: res.confidenceScore ? Number(res.confidenceScore) : null,
      })),
    }));

    return NextResponse.json({ predictions: serializedPredictions });
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}