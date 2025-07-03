import { prisma } from "@/lib/db/client";

const mockPredictions = [
  {
    query: "Bitcoin will reach $100,000 by end of 2025",
    category: "crypto",
    consensusProb: 72,
    resolutionDate: new Date("2025-12-31"),
  },
  {
    query: "AI will achieve AGI by 2030",
    category: "technology",
    consensusProb: 35,
    resolutionDate: new Date("2030-12-31"),
  },
  {
    query: "The next US president will be from the Democratic party",
    category: "politics",
    consensusProb: 58,
    resolutionDate: new Date("2024-11-15"),
  },
  {
    query: "Tesla stock will be above $300 by June 2025",
    category: "finance",
    consensusProb: 65,
    resolutionDate: new Date("2025-06-30"),
  },
  {
    query: "Manchester City will win the Premier League 2024-25",
    category: "sports",
    consensusProb: 78,
    resolutionDate: new Date("2025-05-31"),
  },
];

const aiModels = [
  "GPT-4o",
  "Claude 3.5 Sonnet",
  "Claude 4",
  "Gemini Pro",
  "Llama 3.1 70B",
];

async function seedPredictions() {
  console.log("🌱 Seeding predictions...");

  try {
    for (const pred of mockPredictions) {
      // Create vote session
      const session = await prisma.voteSession.create({
        data: {
          queryText: pred.query,
          isConsensusReached: true,
          consensusValue: pred.consensusProb > 50,
          probability: pred.consensusProb,
          averageConfidence: pred.consensusProb,
          consensusStrength: pred.consensusProb > 70 ? "STRONG" : pred.consensusProb > 40 ? "MODERATE" : "WEAK",
          votesYes: Math.floor(Math.random() * 3) + 2,
          votesNo: Math.floor(Math.random() * 3),
          notVoted: 0,
          timestamp: new Date(),
        },
      });

      // Create prediction
      const prediction = await prisma.prediction.create({
        data: {
          voteSessionId: session.id,
          queryText: pred.query,
          category: pred.category,
          resolutionDate: pred.resolutionDate,
          metadata: {
            consensusProbability: pred.consensusProb,
            createdFromTruthMarket: true,
          },
        },
      });

      // Create outcome
      await prisma.predictionOutcome.create({
        data: {
          predictionId: prediction.id,
          outcomeText: pred.query,
          consensusProbability: pred.consensusProb / 100,
          modelAgreement: (pred.consensusProb - 10 + Math.random() * 20) / 100,
          modelCount: aiModels.length,
        },
      });

      // Create model predictions
      for (const model of aiModels) {
        const variance = Math.random() * 20 - 10; // ±10% variance
        const modelProb = Math.max(0, Math.min(100, pred.consensusProb + variance));
        
        await prisma.modelPrediction.create({
          data: {
            predictionId: prediction.id,
            modelName: model,
            outcomeText: pred.query,
            probability: modelProb / 100,
            confidenceLevel: modelProb > 80 ? "HIGH" : modelProb > 50 ? "MEDIUM" : "LOW",
            reasoning: `Based on current trends and data analysis, I estimate a ${modelProb}% probability.`,
          },
        });
      }

      console.log(`✅ Created prediction: ${pred.query}`);
    }

    // Add some resolved predictions for leaderboard
    const resolvedPred = await prisma.prediction.create({
      data: {
        queryText: "Bitcoin will reach $50,000 by December 2023",
        category: "crypto",
        resolutionDate: new Date("2023-12-31"),
        resolutionStatus: "resolved",
        metadata: {
          consensusProbability: 85,
        },
      },
    });

    await prisma.predictionResolution.create({
      data: {
        predictionId: resolvedPred.id,
        actualOutcome: "Bitcoin will reach $50,000 by December 2023",
        evidence: "Bitcoin reached $50,000 on December 15, 2023",
      },
    });

    console.log("✅ Seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPredictions();