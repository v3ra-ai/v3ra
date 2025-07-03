import { prisma } from "@/lib/db/client";
import { AdaptiveResponse, ConsensusResult, QueryCategory } from "@/lib/types/query-classifier";
import { Prediction, PredictionOutcome, ModelPrediction, Prisma } from "@prisma/client";

export class PredictionTracker {
  async savePrediction(
    adaptiveResponse: AdaptiveResponse,
    voteSessionId: string
  ): Promise<Prediction | null> {
    // Only save predictions for prediction queries
    if (adaptiveResponse.classification.category !== QueryCategory.PREDICTION) {
      return null;
    }

    const consensus = adaptiveResponse.consensus;
    if (!consensus.predictions || consensus.predictions.length === 0) {
      return null;
    }

    try {
      // Create the prediction record
      const prediction = await prisma.prediction.create({
        data: {
          voteSessionId,
          queryText: adaptiveResponse.query,
          category: this.inferPredictionCategory(adaptiveResponse.query),
          resolutionDate: consensus.resolutionDate ? new Date(consensus.resolutionDate) : null,
          metadata: {
            confidence: consensus.confidence,
            modelAgreement: consensus.modelAgreement,
            processingTime: adaptiveResponse.metadata.processingTime,
          },
        },
      });

      // Save prediction outcomes
      const outcomePromises = consensus.predictions.map((pred, index) =>
        prisma.predictionOutcome.create({
          data: {
            predictionId: prediction.id,
            outcomeText: pred.outcome,
            consensusProbability: new Prisma.Decimal(pred.probability),
            modelAgreement: new Prisma.Decimal(consensus.modelAgreement || 0),
            modelCount: adaptiveResponse.validatorResponses.length,
          },
        })
      );

      // Save individual model predictions
      const modelPredictionPromises = adaptiveResponse.validatorResponses.flatMap(response => {
        const parsedResponse = this.parseValidatorResponse(response.rationale || "");
        return parsedResponse.predictions?.map(pred =>
          prisma.modelPrediction.create({
            data: {
              predictionId: prediction.id,
              modelName: response.validatorPublicKey || "unknown",
              outcomeText: pred.outcome,
              probability: new Prisma.Decimal(pred.probability),
              confidenceLevel: this.mapConfidenceLevel(parsedResponse.confidence),
              reasoning: pred.reasoning,
            },
          })
        ) || [];
      });

      await Promise.all([...outcomePromises, ...modelPredictionPromises]);

      return prediction;
    } catch (error) {
      console.error("Error saving prediction:", error);
      return null;
    }
  }

  private inferPredictionCategory(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("election") || lowerQuery.includes("vote") || lowerQuery.includes("president")) {
      return "politics";
    } else if (lowerQuery.includes("game") || lowerQuery.includes("match") || lowerQuery.includes("win") || lowerQuery.includes("championship")) {
      return "sports";
    } else if (lowerQuery.includes("stock") || lowerQuery.includes("price") || lowerQuery.includes("market") || lowerQuery.includes("bitcoin")) {
      return "finance";
    } else if (lowerQuery.includes("technology") || lowerQuery.includes("release") || lowerQuery.includes("launch")) {
      return "technology";
    } else if (lowerQuery.includes("weather") || lowerQuery.includes("temperature") || lowerQuery.includes("rain")) {
      return "weather";
    }
    
    return "general";
  }

  private parseValidatorResponse(rationale: string): any {
    // This is a simplified parser - in production, you'd want to use the actual parser
    // from adaptive-prompts.ts
    const predictions = [];
    const lines = rationale.split('\n');
    let confidence = 0.5;
    
    for (const line of lines) {
      if (line.includes('%')) {
        const match = line.match(/(.+?)\s*-\s*(\d+)%/);
        if (match) {
          predictions.push({
            outcome: match[1].trim(),
            probability: parseInt(match[2]) / 100,
          });
        }
      }
      
      if (line.toLowerCase().includes('confidence:')) {
        const confMatch = line.match(/confidence:\s*(\w+)/i);
        if (confMatch) {
          const confLevel = confMatch[1].toUpperCase();
          confidence = confLevel === 'HIGH' ? 0.8 : confLevel === 'MEDIUM' ? 0.6 : 0.4;
        }
      }
    }
    
    return { predictions, confidence };
  }

  private mapConfidenceLevel(confidence: number): "LOW" | "MEDIUM" | "HIGH" {
    if (confidence >= 0.7) return "HIGH";
    if (confidence >= 0.5) return "MEDIUM";
    return "LOW";
  }

  async getPredictionsByCategory(category: string, limit: number = 10) {
    return prisma.prediction.findMany({
      where: { category },
      include: {
        outcomes: true,
        resolutions: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPendingPredictions(beforeDate?: Date) {
    return prisma.prediction.findMany({
      where: {
        resolutionStatus: 'pending',
        resolutionDate: beforeDate ? { lte: beforeDate } : undefined,
      },
      include: {
        outcomes: true,
        modelPredictions: true,
        _count: {
          select: {
            modelPredictions: true,
          },
        },
      },
      orderBy: { resolutionDate: 'asc' },
    });
  }

  async getResolvedPredictions(limit: number = 20) {
    return prisma.prediction.findMany({
      where: { resolutionStatus: 'resolved' },
      include: {
        outcomes: true,
        resolutions: true,
        modelPredictions: true,
        _count: {
          select: {
            modelPredictions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}