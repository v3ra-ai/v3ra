import { NextResponse } from "next/server";
import { PredictionMetrics } from "@/lib/services/prediction-metrics";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "all";
    
    // Calculate date range
    let startDate: Date | undefined;
    const endDate = new Date();
    
    switch (timeframe) {
      case "week":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "all":
      default:
        startDate = undefined;
    }
    
    // Get model performance data with proper aggregation
    const modelData = await prisma.modelPrediction.groupBy({
      by: ['modelName'],
      where: {
        createdAt: {
          ...(startDate && { gte: startDate }),
          lte: endDate,
        },
        Prediction: {
          resolutionStatus: 'resolved',
        },
      },
      _count: {
        _all: true,
      },
    });
    
    // Get detailed predictions for accuracy calculation
    const predictions = await prisma.prediction.findMany({
      where: {
        resolutionStatus: 'resolved',
        createdAt: {
          ...(startDate && { gte: startDate }),
          lte: endDate,
        },
      },
      include: {
        modelPredictions: true,
        resolutions: true,
      },
    });
    
    // Calculate metrics for each model
    const modelMetrics = modelData.map(model => {
      const modelPredictions = predictions.flatMap(p => 
        p.modelPredictions.filter(mp => mp.modelName === model.modelName)
      );
      
      let correctPredictions = 0;
      let totalBrierScore = 0;
      let totalConfidence = 0;
      const categoryAccuracy: Record<string, { correct: number; total: number }> = {};
      
      modelPredictions.forEach(mp => {
        const prediction = predictions.find(p => p.id === mp.predictionId);
        const resolution = prediction?.resolutions[0];
        
        if (resolution) {
          const probability = mp.probability?.toNumber() || 0;
          const wasCorrect = mp.outcomeText === resolution.actualOutcome;
          
          if (wasCorrect) correctPredictions++;
          
          // Calculate Brier score component
          totalBrierScore += Math.pow(probability - (wasCorrect ? 1 : 0), 2);
          totalConfidence += probability;
          
          // Track category performance
          const category = prediction.category || 'general';
          if (!categoryAccuracy[category]) {
            categoryAccuracy[category] = { correct: 0, total: 0 };
          }
          categoryAccuracy[category].total++;
          if (wasCorrect) categoryAccuracy[category].correct++;
        }
      });
      
      const totalPredictions = modelPredictions.length;
      const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) : 0;
      const avgBrierScore = totalPredictions > 0 ? (totalBrierScore / totalPredictions) : 0;
      const avgConfidence = totalPredictions > 0 ? (totalConfidence / totalPredictions) : 0;
      
      // Find best and worst categories
      let bestCategory = 'general';
      let worstCategory = 'general';
      let bestAccuracy = 0;
      let worstAccuracy = 1;
      
      Object.entries(categoryAccuracy).forEach(([cat, stats]) => {
        const catAccuracy = stats.total > 0 ? stats.correct / stats.total : 0;
        if (catAccuracy > bestAccuracy) {
          bestAccuracy = catAccuracy;
          bestCategory = cat;
        }
        if (catAccuracy < worstAccuracy) {
          worstAccuracy = catAccuracy;
          worstCategory = cat;
        }
      });
      
      return {
        modelName: model.modelName,
        totalPredictions,
        correctPredictions,
        accuracy: Math.round(accuracy * 100),
        brierScore: avgBrierScore,
        calibrationScore: 1 - avgBrierScore, // Simple calibration approximation
        avgConfidence: Math.round(avgConfidence * 100),
        bestCategory,
        worstCategory,
        streak: 0, // TODO: Calculate winning streak
      };
    });
    
    // Sort by accuracy
    modelMetrics.sort((a, b) => b.accuracy - a.accuracy);
    
    // If no data, return mock data for demo
    if (modelMetrics.length === 0) {
      const mockModels = [
        {
          modelName: "Claude 4",
          totalPredictions: 156,
          correctPredictions: 134,
          accuracy: 86,
          brierScore: 0.142,
          calibrationScore: 0.858,
          avgConfidence: 82,
          bestCategory: "technology",
          worstCategory: "sports",
          streak: 7,
        },
        {
          modelName: "GPT-4o",
          totalPredictions: 203,
          correctPredictions: 168,
          accuracy: 83,
          brierScore: 0.171,
          calibrationScore: 0.829,
          avgConfidence: 78,
          bestCategory: "finance",
          worstCategory: "politics",
          streak: 4,
        },
        {
          modelName: "Claude 3.5 Sonnet",
          totalPredictions: 189,
          correctPredictions: 151,
          accuracy: 80,
          brierScore: 0.198,
          calibrationScore: 0.802,
          avgConfidence: 75,
          bestCategory: "crypto",
          worstCategory: "sports",
          streak: 2,
        },
        {
          modelName: "Gemini Pro",
          totalPredictions: 142,
          correctPredictions: 109,
          accuracy: 77,
          brierScore: 0.234,
          calibrationScore: 0.766,
          avgConfidence: 71,
          bestCategory: "general",
          worstCategory: "crypto",
          streak: 0,
        },
        {
          modelName: "Llama 3.1 70B",
          totalPredictions: 98,
          correctPredictions: 71,
          accuracy: 72,
          brierScore: 0.278,
          calibrationScore: 0.722,
          avgConfidence: 68,
          bestCategory: "technology",
          worstCategory: "finance",
          streak: 1,
        },
      ];
      
      return NextResponse.json({
        models: mockModels,
        timeframe,
      });
    }
    
    return NextResponse.json({
      models: modelMetrics,
      timeframe,
    });
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return NextResponse.json(
      { error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}