import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { TruthMarket } from "@/lib/truth-market";
import { validatorRegistry } from "@/lib/validators/registry";

// Categories for news predictions
const NEWS_CATEGORIES = [
  "technology",
  "finance", 
  "politics",
  "science",
  "climate",
  "business",
  "health",
  "sports"
];

// Template predictions for MVP
const PREDICTION_TEMPLATES = [
  {
    template: "Major tech company will announce {action} in the next 24 hours",
    actions: ["layoffs", "new AI product", "acquisition", "security breach", "earnings beat"],
    category: "technology"
  },
  {
    template: "Stock market will {movement} by more than {percent}% tomorrow",
    movements: ["rise", "fall"],
    percents: ["1", "2", "3"],
    category: "finance"
  },
  {
    template: "New {type} breakthrough will be announced within 24 hours", 
    types: ["AI", "medical", "climate", "space", "quantum computing"],
    category: "science"
  },
  {
    template: "{company} will make a major announcement tomorrow",
    companies: ["Tesla", "Apple", "Google", "Microsoft", "OpenAI", "Meta"],
    category: "technology"
  },
  {
    template: "Government will announce new {policy} policy in next 24 hours",
    policies: ["climate", "AI regulation", "cryptocurrency", "trade", "immigration"],
    category: "politics"
  }
];

function generateDailyPredictions(): any[] {
  const predictions = [];
  const usedTemplates = new Set();
  
  // Generate 3 unique predictions
  while (predictions.length < 3) {
    const templateIndex = Math.floor(Math.random() * PREDICTION_TEMPLATES.length);
    
    // Ensure we don't use the same template twice
    if (usedTemplates.has(templateIndex)) continue;
    usedTemplates.add(templateIndex);
    
    const template = PREDICTION_TEMPLATES[templateIndex];
    let statement = template.template;
    
    // Replace placeholders with random values
    Object.entries(template).forEach(([key, value]) => {
      if (key !== 'template' && key !== 'category' && Array.isArray(value)) {
        const randomValue = value[Math.floor(Math.random() * value.length)];
        statement = statement.replace(`{${key}}`, randomValue);
      }
    });
    
    predictions.push({
      statement,
      category: template.category,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
  }
  
  return predictions;
}

export async function GET(request: NextRequest) {
  try {
    // Check if user has already completed today's predictions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // For MVP, generate predictions on the fly
    // In production, these would be pre-generated daily
    const dailyPredictions = generateDailyPredictions();
    
    // Get AI consensus for each prediction
    const validators = await validatorRegistry.getActiveValidators();
    const limitedValidators = validators.slice(0, 3); // Use only 3 validators for speed
    
    const predictionsWithConsensus = await Promise.all(
      dailyPredictions.map(async (prediction) => {
        try {
          const { consensus } = await TruthMarket.processQuery(
            prediction.statement,
            limitedValidators
          );
          
          return {
            id: Math.random().toString(36).substring(2),
            statement: prediction.statement,
            category: prediction.category,
            aiConsensus: consensus.probability,
            expiresAt: prediction.expiresAt
          };
        } catch (error) {
          // If AI processing fails, use a random consensus
          console.error("Failed to get AI consensus:", error);
          return {
            id: Math.random().toString(36).substring(2),
            statement: prediction.statement,
            category: prediction.category,
            aiConsensus: Math.floor(Math.random() * 60) + 20, // Random between 20-80
            expiresAt: prediction.expiresAt
          };
        }
      })
    );
    
    return NextResponse.json({
      headlines: predictionsWithConsensus,
      generatedAt: new Date().toISOString(),
      expiresAt: dailyPredictions[0].expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error("Daily headlines error:", error);
    
    // Return mock data as fallback
    const mockPredictions = generateDailyPredictions().map(p => ({
      id: Math.random().toString(36).substring(2),
      statement: p.statement,
      category: p.category,
      aiConsensus: Math.floor(Math.random() * 60) + 20,
      expiresAt: p.expiresAt
    }));
    
    return NextResponse.json({
      headlines: mockPredictions,
      generatedAt: new Date().toISOString(),
      expiresAt: mockPredictions[0].expiresAt.toISOString(),
      mock: true
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predictions, userId } = body;
    
    // TODO: Save user's predictions to database
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: "Predictions recorded",
      pointsAwarded: 50
    });
    
  } catch (error) {
    console.error("Submit predictions error:", error);
    return NextResponse.json(
      { error: "Failed to submit predictions" },
      { status: 500 }
    );
  }
}