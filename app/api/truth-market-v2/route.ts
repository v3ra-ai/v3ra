import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { TruthMarket } from "@/lib/truth-market";
import { validatorRegistry } from "@/lib/validators/registry";
import { prisma } from "@/lib/db/client";

const truthMarketSchema = z.object({
  query: z.string().min(1, "Query is required"),
  selectedLLMIds: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function detectCategory(statement: string): string {
  const lower = statement.toLowerCase();
  
  // Simple category detection - can be enhanced
  if (lower.includes('bitcoin') || lower.includes('crypto') || lower.includes('ethereum')) {
    return 'crypto';
  } else if (lower.includes('election') || lower.includes('president') || lower.includes('vote')) {
    return 'politics';
  } else if (lower.includes('stock') || lower.includes('market') || lower.includes('economy')) {
    return 'finance';
  } else if (lower.includes('ai') || lower.includes('agi') || lower.includes('technology')) {
    return 'technology';
  } else if (lower.includes('climate') || lower.includes('weather') || lower.includes('temperature')) {
    return 'climate';
  } else if (lower.includes('game') || lower.includes('championship') || lower.includes('win')) {
    return 'sports';
  }
  
  return 'general';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const parsedBody = truthMarketSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.format() },
        { status: 400 }
      );
    }
    
    const { query, selectedLLMIds, userId } = parsedBody.data;
    
    // Get validators
    let validators;
    if (selectedLLMIds && selectedLLMIds.length > 0) {
      // Get specific validators
      const validatorPromises = selectedLLMIds.map(id => 
        validatorRegistry.getValidator(id)
      );
      const results = await Promise.all(validatorPromises);
      validators = results.filter(v => v !== undefined);
    } else {
      // Get default active validators
      validators = await validatorRegistry.getActiveValidators();
      // Limit to 5 validators if none selected
      validators = validators.slice(0, 5);
    }
    
    if (validators.length === 0) {
      return NextResponse.json(
        { error: "No validators available" },
        { status: 503 }
      );
    }
    
    // Process through Truth Market
    const { statement, consensus, positions } = await TruthMarket.processQuery(
      query,
      validators
    );
    
    console.log('Truth Market Result:', {
      query,
      statement,
      hasTimeframe: !!statement.timeframe,
      timeframe: statement.timeframe,
      isFuture: statement.timeframe && statement.timeframe > new Date()
    });
    
    // Generate IDs
    const sessionId = generateId();
    
    // Check if this is a prediction (has future timeframe)
    const isPrediction = statement.timeframe && statement.timeframe > new Date();
    console.log('Prediction check:', { isPrediction, timeframe: statement.timeframe });
    
    // Save to database (simplified for now)
    try {
      await prisma.voteSession.create({
        data: {
          id: sessionId,
          queryText: query,
          isConsensusReached: consensus.consensusStrength !== 'WEAK',
          consensusValue: consensus.probability > 50,
          votesYes: positions.filter(p => p.position === 'YES').length,
          votesNo: positions.filter(p => p.position === 'NO').length,
          notVoted: positions.filter(p => p.position === 'UNCERTAIN').length,
          timestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: userId,
        }
      });
      
      // Save validator responses
      const responsePromises = positions.map(position => 
        prisma.validatorResponse.create({
          data: {
            id: generateId(),
            voteSessionId: sessionId,
            validatorId: position.validatorId,
            vote: position.position,
            rationale: position.reasoning,
            confidence: position.confidence / 100, // Convert to 0-1 scale
            latency: position.responseTime,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        })
      );
      
      await Promise.all(responsePromises);
      
      // If this is a prediction, create prediction records
      if (isPrediction) {
        try {
          // Create the prediction
          const prediction = await prisma.prediction.create({
            data: {
              voteSessionId: sessionId,
              queryText: statement.statement,
              resolutionDate: statement.timeframe,
              resolutionStatus: 'pending', // Set status to pending
              category: detectCategory(statement.statement),
              createdBy: userId,
              metadata: {
                originalQuery: query,
                context: statement.context,
                consensusProbability: consensus.probability,
                createdFromTruthMarket: true
              }
            }
          });
          
          // Create the main outcome (binary for now)
          await prisma.predictionOutcome.create({
            data: {
              predictionId: prediction.id,
              outcomeText: statement.statement,
              consensusProbability: consensus.probability / 100,
              modelAgreement: consensus.confidence / 100,
              modelCount: positions.length
            }
          });
          
          // Create individual model predictions
          const modelPredictionPromises = positions.map(position =>
            prisma.modelPrediction.create({
              data: {
                predictionId: prediction.id,
                modelName: position.modelName,
                outcomeText: statement.statement,
                probability: position.position === 'YES' ? position.confidence / 100 : 
                           position.position === 'NO' ? (100 - position.confidence) / 100 : 0.5,
                confidenceLevel: position.confidence > 80 ? 'HIGH' : 
                               position.confidence > 50 ? 'MEDIUM' : 'LOW',
                reasoning: position.reasoning
              }
            })
          );
          
          await Promise.all(modelPredictionPromises);
        } catch (predictionError) {
          console.error("Prediction creation error:", predictionError);
          // Continue - don't fail the main request
        }
      }
    } catch (dbError) {
      console.error("Database save error:", dbError);
      // Continue even if database save fails
    }
    
    // Format response
    let predictionId: string | undefined;
    
    // If a prediction was created, get its ID
    if (isPrediction) {
      try {
        const prediction = await prisma.prediction.findFirst({
          where: { voteSessionId: sessionId },
          select: { id: true }
        });
        predictionId = prediction?.id;
        console.log('Found prediction in DB:', predictionId);
      } catch (error) {
        console.error("Error fetching prediction ID:", error);
        // For demo mode, create a mock prediction ID
        predictionId = `demo-prediction-${Date.now()}`;
        console.log('Using demo prediction ID:', predictionId);
      }
    }
    
    const response = {
      id: sessionId,
      statement: statement,
      consensus: consensus,
      positions: positions.map(p => ({
        validatorId: p.validatorId,
        modelName: p.modelName,
        position: p.position,
        confidence: p.confidence,
        reasoning: p.reasoning,
        responseTime: p.responseTime
      })),
      timestamp: new Date().toISOString(),
      isPrediction: isPrediction,
      predictionTracked: isPrediction, // Auto-tracked if it's a prediction
      predictionId: predictionId,
      
      // Include legacy fields for compatibility
      queryText: query,
      isConsensusReached: consensus.consensusStrength !== 'WEAK',
      consensusValue: consensus.probability > 50,
      votingResult: {
        yes: positions.filter(p => p.position === 'YES').length,
        no: positions.filter(p => p.position === 'NO').length,
        uncertain: positions.filter(p => p.position === 'UNCERTAIN').length,
      }
    };
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: unknown) {
    console.error("Truth Market API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}