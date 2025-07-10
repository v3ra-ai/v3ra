import { prisma } from "@/lib/db/client";
import { Prediction, Prisma } from "@prisma/client";

export interface ResolutionResult {
  success: boolean;
  outcome?: string;
  evidence?: string;
  confidence?: number;
  source?: string;
}

export interface ResolutionStrategy {
  resolve(prediction: Prediction): Promise<ResolutionResult>;
}

export class PredictionResolver {
  private resolvers: Map<string, ResolutionStrategy>;

  constructor() {
    this.resolvers = new Map([
      ['sports', new SportsResolver()],
      ['elections', new ElectionResolver()],
      ['finance', new FinanceResolver()],
      ['default', new ManualResolver()]
    ]);
  }

  async checkPendingPredictions() {
    const pending = await prisma.prediction.findMany({
      where: {
        resolutionStatus: 'pending',
        resolutionDate: { lte: new Date() }
      },
      include: {
        outcomes: true,
        modelPredictions: true,
      }
    });

    console.log(`Found ${pending.length} predictions ready for resolution`);

    for (const prediction of pending) {
      await this.attemptResolution(prediction);
    }
  }

  private async attemptResolution(prediction: Prediction) {
    const category = prediction.category || 'default';
    const resolver = this.resolvers.get(category) || this.resolvers.get('default')!;
    
    try {
      const result = await resolver.resolve(prediction);
      
      if (result.success && result.outcome) {
        await this.recordResolution(prediction.id, result);
        await this.updateModelPerformance(prediction.id, result.outcome);
      }
    } catch (error) {
      console.error(`Failed to resolve prediction ${prediction.id}:`, error);
    }
  }

  private async recordResolution(
    predictionId: string,
    result: ResolutionResult
  ) {
    await prisma.predictionResolution.create({
      data: {
        predictionId,
        actualOutcome: result.outcome!,
        resolutionMethod: 'automated',
        verificationSource: result.source,
        evidence: result.evidence,
        confidenceScore: result.confidence ? new Prisma.Decimal(result.confidence) : null,
      },
    });

    await prisma.prediction.update({
      where: { id: predictionId },
      data: { resolutionStatus: 'resolved' },
    });
  }

  private async updateModelPerformance(predictionId: string, actualOutcome: string) {
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      include: {
        modelPredictions: true,
        outcomes: true,
      },
    });

    if (!prediction) return;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    for (const modelPred of prediction.modelPredictions) {
      const wasCorrect = modelPred.outcomeText.toLowerCase() === actualOutcome.toLowerCase();
      
      // Calculate Brier score component for this prediction
      const actualOutcomeProb = modelPred.outcomeText === actualOutcome ? 1 : 0;
      const brierComponent = Math.pow(Number(modelPred.probability) - actualOutcomeProb, 2);

      await prisma.modelPerformance.upsert({
        where: {
          modelName_periodStart_category: {
            modelName: modelPred.modelName,
            periodStart: startOfMonth,
            category: prediction.category || 'general',
          },
        },
        update: {
          totalPredictions: { increment: 1 },
          accuratePredictions: wasCorrect ? { increment: 1 } : undefined,
          // These would need to be recalculated based on all predictions in the period
          // In a real implementation, you'd run a batch job to calculate these
        },
        create: {
          modelName: modelPred.modelName,
          periodStart: startOfMonth,
          periodEnd: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0),
          category: prediction.category || 'general',
          totalPredictions: 1,
          accuratePredictions: wasCorrect ? 1 : 0,
          brierScore: new Prisma.Decimal(brierComponent),
        },
      });
    }
  }

  async resolveManually(
    predictionId: string,
    outcome: string,
    evidence: string,
    resolverId: string
  ) {
    const result: ResolutionResult = {
      success: true,
      outcome,
      evidence,
      confidence: 0.9,
      source: `User: ${resolverId}`,
    };

    await this.recordResolution(predictionId, result);
    await this.updateModelPerformance(predictionId, outcome);

    await prisma.predictionResolution.update({
      where: { 
        predictionId_actualOutcome: {
          predictionId,
          actualOutcome: outcome,
        },
      },
      data: {
        resolutionMethod: 'user_verified',
        resolverId,
      },
    });
  }
}

// Example resolver implementations
class SportsResolver implements ResolutionStrategy {
  async resolve(prediction: Prediction): Promise<ResolutionResult> {
    // In a real implementation, this would call sports APIs
    // For now, return a mock result
    console.log(`SportsResolver: Checking ${prediction.queryText}`);
    
    // Mock implementation - in production, you'd call actual APIs
    return {
      success: false, // Would be true if we found a result
      evidence: "No sports API configured",
    };
  }
}

class ElectionResolver implements ResolutionStrategy {
  async resolve(prediction: Prediction): Promise<ResolutionResult> {
    console.log(`ElectionResolver: Checking ${prediction.queryText}`);
    
    // Mock implementation
    return {
      success: false,
      evidence: "No election API configured",
    };
  }
}

class FinanceResolver implements ResolutionStrategy {
  async resolve(prediction: Prediction): Promise<ResolutionResult> {
    console.log(`FinanceResolver: Checking ${prediction.queryText}`);
    
    // Mock implementation - could integrate with financial data APIs
    return {
      success: false,
      evidence: "No finance API configured",
    };
  }
}

class ManualResolver implements ResolutionStrategy {
  async resolve(_prediction: Prediction): Promise<ResolutionResult> {
    // Manual resolver always returns false, requiring human intervention
    return {
      success: false,
      evidence: "Manual resolution required",
    };
  }
}