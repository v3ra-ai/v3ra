import { prisma } from "@/lib/db/client";
import { Decimal } from "@prisma/client/runtime/library";

export interface CalibrationBucket {
  range: [number, number];
  expectedRate: number;
  actualRate: number;
  count: number;
}

export interface ModelMetrics {
  modelName: string;
  accuracy: number;
  brierScore: number;
  calibrationScore: number;
  totalPredictions: number;
  categoryPerformance: Record<string, number>;
}

export class PredictionMetrics {
  async calculateOverallMetrics() {
    const resolvedPredictions = await prisma.prediction.findMany({
      where: { resolutionStatus: 'resolved' },
      include: {
        outcomes: true,
        resolutions: true,
        modelPredictions: true,
      },
    });

    const totalPredictions = resolvedPredictions.length;
    if (totalPredictions === 0) {
      return {
        accuracy: 0,
        brierScore: 0,
        calibration: [],
        totalPredictions: 0,
      };
    }

    // Calculate accuracy (primary prediction was correct)
    let correctPredictions = 0;
    let totalBrierScore = 0;

    for (const prediction of resolvedPredictions) {
      const resolution = prediction.resolutions[0];
      if (!resolution) continue;

      // Check if the highest probability outcome was correct
      const sortedOutcomes = prediction.outcomes.sort(
        (a, b) => Number(b.consensusProbability) - Number(a.consensusProbability)
      );
      
      if (sortedOutcomes[0]?.outcomeText === resolution.actualOutcome) {
        correctPredictions++;
      }

      // Calculate Brier score for this prediction
      const brierScore = this.calculateBrierScoreForPrediction(
        prediction.outcomes,
        resolution.actualOutcome
      );
      totalBrierScore += brierScore;
    }

    const accuracy = correctPredictions / totalPredictions;
    const avgBrierScore = totalBrierScore / totalPredictions;
    const calibration = await this.calculateCalibration(resolvedPredictions);

    return {
      accuracy,
      brierScore: avgBrierScore,
      calibration,
      totalPredictions,
      accuracyTrend: await this.calculateAccuracyTrend(),
    };
  }

  private calculateBrierScoreForPrediction(
    outcomes: Array<{ outcomeText: string; consensusProbability: Decimal | null }>,
    actualOutcome: string
  ): number {
    let brierScore = 0;

    for (const outcome of outcomes) {
      const probability = Number(outcome.consensusProbability || 0);
      const actual = outcome.outcomeText === actualOutcome ? 1 : 0;
      brierScore += Math.pow(probability - actual, 2);
    }

    return brierScore;
  }

  async calculateCalibration(
    resolvedPredictions?: any[]
  ): Promise<CalibrationBucket[]> {
    if (!resolvedPredictions) {
      resolvedPredictions = await prisma.prediction.findMany({
        where: { resolutionStatus: 'resolved' },
        include: {
          outcomes: true,
          resolutions: true,
        },
      });
    }

    // Create 10 buckets (0-10%, 10-20%, ..., 90-100%)
    const buckets: CalibrationBucket[] = [];
    for (let i = 0; i < 10; i++) {
      buckets.push({
        range: [i * 0.1, (i + 1) * 0.1],
        expectedRate: i * 0.1 + 0.05,
        actualRate: 0,
        count: 0,
      });
    }

    // Populate buckets with actual data
    for (const prediction of resolvedPredictions) {
      const resolution = prediction.resolutions[0];
      if (!resolution) continue;

      for (const outcome of prediction.outcomes) {
        if (outcome.outcomeText === resolution.actualOutcome) {
          const probability = Number(outcome.consensusProbability || 0);
          const bucketIndex = Math.min(Math.floor(probability * 10), 9);
          buckets[bucketIndex].count++;
          buckets[bucketIndex].actualRate += 1;
        }
      }
    }

    // Calculate actual rates
    for (const bucket of buckets) {
      if (bucket.count > 0) {
        bucket.actualRate = bucket.actualRate / bucket.count;
      }
    }

    return buckets;
  }

  async getModelLeaderboard(): Promise<ModelMetrics[]> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const modelPerformance = await prisma.modelPerformance.findMany({
      where: {
        periodStart: { gte: currentMonth },
      },
    });

    // Group by model name
    const modelMap = new Map<string, ModelMetrics>();

    for (const perf of modelPerformance) {
      const existing = modelMap.get(perf.modelName) || {
        modelName: perf.modelName,
        accuracy: 0,
        brierScore: 0,
        calibrationScore: 0,
        totalPredictions: 0,
        categoryPerformance: {},
      };

      const accuracy = perf.accuratePredictions / perf.totalPredictions;
      
      // Weight by number of predictions
      existing.accuracy = 
        (existing.accuracy * existing.totalPredictions + accuracy * perf.totalPredictions) /
        (existing.totalPredictions + perf.totalPredictions);
      
      existing.totalPredictions += perf.totalPredictions;
      
      if (perf.category) {
        existing.categoryPerformance[perf.category] = accuracy;
      }

      if (perf.brierScore) {
        existing.brierScore = Number(perf.brierScore);
      }

      if (perf.calibrationScore) {
        existing.calibrationScore = Number(perf.calibrationScore);
      }

      modelMap.set(perf.modelName, existing);
    }

    return Array.from(modelMap.values()).sort((a, b) => b.accuracy - a.accuracy);
  }

  async getCategoryBreakdown() {
    const predictions = await prisma.prediction.groupBy({
      by: ['category', 'resolutionStatus'],
      _count: true,
    });

    const breakdown: Record<string, { total: number; resolved: number; accuracy?: number }> = {};

    for (const pred of predictions) {
      const category = pred.category || 'general';
      if (!breakdown[category]) {
        breakdown[category] = { total: 0, resolved: 0 };
      }
      
      breakdown[category].total += pred._count;
      if (pred.resolutionStatus === 'resolved') {
        breakdown[category].resolved += pred._count;
      }
    }

    // Calculate accuracy for each category
    for (const category of Object.keys(breakdown)) {
      const resolved = await prisma.prediction.findMany({
        where: {
          category,
          resolutionStatus: 'resolved',
        },
        include: {
          outcomes: true,
          resolutions: true,
        },
      });

      let correct = 0;
      for (const pred of resolved) {
        const resolution = pred.resolutions[0];
        if (!resolution) continue;

        const highestProb = pred.outcomes.sort(
          (a, b) => Number(b.consensusProbability) - Number(a.consensusProbability)
        )[0];

        if (highestProb?.outcomeText === resolution.actualOutcome) {
          correct++;
        }
      }

      breakdown[category].accuracy = resolved.length > 0 ? correct / resolved.length : 0;
    }

    return breakdown;
  }

  private async calculateAccuracyTrend() {
    // Calculate accuracy trend over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPredictions = await prisma.prediction.findMany({
      where: {
        resolutionStatus: 'resolved',
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        outcomes: true,
        resolutions: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (recentPredictions.length < 10) {
      return 0; // Not enough data for trend
    }

    // Calculate accuracy for first half vs second half
    const midpoint = Math.floor(recentPredictions.length / 2);
    const firstHalf = recentPredictions.slice(0, midpoint);
    const secondHalf = recentPredictions.slice(midpoint);

    const firstHalfAccuracy = this.calculateAccuracyForSet(firstHalf);
    const secondHalfAccuracy = this.calculateAccuracyForSet(secondHalf);

    return secondHalfAccuracy - firstHalfAccuracy; // Positive means improving
  }

  private calculateAccuracyForSet(predictions: any[]): number {
    if (predictions.length === 0) return 0;

    let correct = 0;
    for (const pred of predictions) {
      const resolution = pred.resolutions[0];
      if (!resolution) continue;

      const highestProb = pred.outcomes.sort(
        (a, b) => Number(b.consensusProbability) - Number(a.consensusProbability)
      )[0];

      if (highestProb?.outcomeText === resolution.actualOutcome) {
        correct++;
      }
    }

    return correct / predictions.length;
  }
}