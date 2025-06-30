import { NextResponse } from "next/server";
import { PredictionMetrics } from "@/lib/services/prediction-metrics";

export async function GET(request: Request) {
  try {
    const metrics = new PredictionMetrics();
    
    const [overallMetrics, modelLeaderboard, categoryBreakdown] = await Promise.all([
      metrics.calculateOverallMetrics(),
      metrics.getModelLeaderboard(),
      metrics.getCategoryBreakdown(),
    ]);

    return NextResponse.json({
      overall: overallMetrics,
      models: modelLeaderboard,
      categories: categoryBreakdown,
    });
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return NextResponse.json(
      { error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}