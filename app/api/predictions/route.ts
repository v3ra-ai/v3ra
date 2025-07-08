import { NextResponse } from "next/server";
import { PredictionTracker } from "@/lib/services/prediction-tracker";
import { rateLimitRelaxed } from "@/lib/middleware/rate-limit";

export const GET = rateLimitRelaxed(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");

    // For demo mode, return mock predictions if database is not available
    try {
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
    } catch (dbError: any) {
      // If database fails, return demo predictions
      console.log("Database unavailable, returning demo predictions");
      
      const demoPredictions = getDemoPredictions(status);
      return NextResponse.json({ predictions: demoPredictions });
    }
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
});

function getDemoPredictions(status: string) {
  const pendingPredictions = [
    {
      id: "demo-1",
      queryText: "Will AI achieve AGI by 2030?",
      category: "technology",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      resolutionDate: "2030-12-31T23:59:59Z",
      resolutionStatus: "pending",
      outcomes: [
        {
          outcomeText: "AI will achieve AGI by 2030",
          consensusProbability: 0.35,
          modelAgreement: 0.60,
        }
      ],
      resolutions: []
    },
    {
      id: "demo-2",
      queryText: "Will Bitcoin reach $100,000 by December 2025?",
      category: "crypto",
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      resolutionDate: "2025-12-31T23:59:59Z",
      resolutionStatus: "pending",
      outcomes: [
        {
          outcomeText: "Bitcoin will reach $100,000 by December 2025",
          consensusProbability: 0.29,
          modelAgreement: 0.45,
        }
      ],
      resolutions: []
    }
  ];

  const resolvedPredictions = [
    {
      id: "demo-3",
      queryText: "Will GPT-5 be released in 2024?",
      category: "technology",
      createdAt: new Date(Date.now() - 7776000000).toISOString(), // 90 days ago
      resolutionDate: "2024-12-31T23:59:59Z",
      resolutionStatus: "resolved",
      outcomes: [
        {
          outcomeText: "GPT-5 will be released in 2024",
          consensusProbability: 0.65,
          modelAgreement: 0.70,
        }
      ],
      resolutions: [{
        actualOutcome: "GPT-5 was not released in 2024",
        resolvedAt: new Date(Date.now() - 86400000).toISOString(),
        evidence: "No official announcement from OpenAI",
        confidenceScore: 0.95
      }]
    }
  ];

  return status === "pending" ? pendingPredictions : resolvedPredictions;
}