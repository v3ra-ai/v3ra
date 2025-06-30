import {
  QueryCategory,
  ConsensusResult,
  AdaptiveResponse,
  QueryClassification,
  ParsedResponse,
  Perspective
} from "@/lib/types/query-classifier";
import { VoteValidatorResponse } from "@/lib/types";
import { getPromptForCategory } from "@/lib/validators/prompts/adaptive-prompts";
import { PredictionNormalizer } from "./prediction-normalizer";

export class AdaptiveResponseProcessor {
  processResponses(
    query: string,
    classification: QueryClassification,
    validatorResponses: VoteValidatorResponse[],
    processingTime: number
  ): AdaptiveResponse {
    const promptConfig = getPromptForCategory(classification.category);
    const parsedResponses = this.parseValidatorResponses(
      validatorResponses,
      promptConfig.responseParser
    );

    const consensus = this.calculateAdaptiveConsensus(
      classification.category,
      parsedResponses,
      validatorResponses
    );

    return {
      id: '', // Will be set by caller
      query,
      classification,
      consensus,
      validatorResponses,
      metadata: {
        processingTime,
        modelsQueried: validatorResponses.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private parseValidatorResponses(
    responses: VoteValidatorResponse[],
    parser: (response: string) => ParsedResponse
  ): ParsedResponse[] {
    return responses.map(response => {
      try {
        return parser(response.rationale || "");
      } catch (error) {
        console.error("Error parsing response:", error);
        return {
          primary: "ERROR",
          explanation: response.rationale || "Failed to parse response",
          confidence: 0,
        };
      }
    });
  }

  private calculateAdaptiveConsensus(
    category: QueryCategory,
    parsedResponses: ParsedResponse[],
    rawResponses: VoteValidatorResponse[]
  ): ConsensusResult {
    switch (category) {
      case QueryCategory.FACT_CHECK:
        return this.calculateFactCheckConsensus(parsedResponses, rawResponses);
      
      case QueryCategory.QUESTION_ANSWER:
        return this.calculateQuestionAnswerConsensus(parsedResponses);
      
      case QueryCategory.IDENTITY_PHILOSOPHY:
      case QueryCategory.OPINION_DEBATE:
        return this.calculatePerspectivesConsensus(parsedResponses, category);
      
      case QueryCategory.CURRENT_EVENTS:
        return this.calculateCurrentEventsConsensus(parsedResponses);
      
      case QueryCategory.PREDICTION:
        return this.calculatePredictionConsensus(parsedResponses);
      
      default:
        return this.calculateFactCheckConsensus(parsedResponses, rawResponses);
    }
  }

  private calculateFactCheckConsensus(
    parsedResponses: ParsedResponse[],
    rawResponses: VoteValidatorResponse[]
  ): ConsensusResult {
    const votes = parsedResponses.map(r => r.primary);
    const yesCount = votes.filter(v => v === "YES").length;
    const noCount = votes.filter(v => v === "NO").length;
    const uncertainCount = votes.filter(v => v === "UNKNOWN").length;
    const totalValidVotes = yesCount + noCount + uncertainCount;

    let consensusValue: boolean | null = null;
    let summary = "";
    let confidence = 0;

    if (totalValidVotes === 0) {
      summary = "No valid responses received";
    } else if (uncertainCount > totalValidVotes / 2) {
      summary = "Cannot be determined - matter of belief or lacks evidence";
      consensusValue = null;
      confidence = 0.5;
    } else if (yesCount > noCount * 2) {
      consensusValue = true;
      summary = "Consensus: Statement is factually accurate";
      confidence = yesCount / totalValidVotes;
    } else if (noCount > yesCount * 2) {
      consensusValue = false;
      summary = "Consensus: Statement contains inaccuracies";
      confidence = noCount / totalValidVotes;
    } else if (uncertainCount > 0 && uncertainCount >= Math.max(yesCount, noCount) / 2) {
      summary = "Mixed responses with many unknowns";
      confidence = 0.6;
    } else {
      summary = "Mixed responses - no clear consensus";
      confidence = 0.5;
    }

    // Extract key points from explanations
    const keyPoints = this.extractKeyPoints(parsedResponses);

    // Add vote breakdown to summary
    const voteBreakdown = `(${yesCount} YES, ${noCount} NO, ${uncertainCount} UNKNOWN)`;

    return {
      category: QueryCategory.FACT_CHECK,
      value: consensusValue,
      confidence,
      summary: `${summary} ${voteBreakdown}`,
      keyPoints,
      modelAgreement: this.calculateAgreement(votes),
    };
  }

  private calculateQuestionAnswerConsensus(
    parsedResponses: ParsedResponse[]
  ): ConsensusResult {
    // Use the most detailed answer as primary
    const bestAnswer = parsedResponses
      .filter(r => r.confidence && r.confidence > 0.5)
      .sort((a, b) => (b.evidence?.length || 0) - (a.evidence?.length || 0))[0];

    const keyPoints = this.extractKeyPoints(parsedResponses);

    return {
      category: QueryCategory.QUESTION_ANSWER,
      answer: bestAnswer?.primary || "Multiple answers provided",
      confidence: bestAnswer?.confidence || 0.7,
      summary: `${parsedResponses.length} models provided answers`,
      keyPoints,
      modelAgreement: 0.8, // Q&A doesn't require strict agreement
    };
  }

  private calculatePerspectivesConsensus(
    parsedResponses: ParsedResponse[],
    category: QueryCategory
  ): ConsensusResult {
    // Collect unique perspectives
    const perspectives = parsedResponses
      .flatMap(r => r.perspectives || [])
      .filter((p, i, arr) => 
        arr.findIndex(x => x.viewpoint.toLowerCase() === p.viewpoint.toLowerCase()) === i
      )
      .slice(0, 5);
    
    const summary = category === QueryCategory.IDENTITY_PHILOSOPHY
      ? "This philosophical question has multiple valid interpretations"
      : "This topic involves multiple legitimate viewpoints";

    return {
      category,
      perspectives,
      confidence: 0.8,
      summary,
      keyPoints: perspectives.map(p => p.viewpoint),
      modelAgreement: 0.7, // Perspectives don't require agreement
    };
  }

  private calculateCurrentEventsConsensus(
    parsedResponses: ParsedResponse[]
  ): ConsensusResult {
    const keyPoints = this.extractKeyPoints(parsedResponses);
    
    const bestResponse = parsedResponses
      .filter(r => r.confidence && r.confidence > 0.5)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];

    const beyondCutoff = parsedResponses.some(r => 
      r.explanation?.toLowerCase().includes("beyond knowledge") ||
      r.explanation?.toLowerCase().includes("cutoff")
    );

    return {
      category: QueryCategory.CURRENT_EVENTS,
      answer: bestResponse?.primary || "Information not available",
      confidence: beyondCutoff ? 0.3 : (bestResponse?.confidence || 0.7),
      summary: beyondCutoff 
        ? "This event may be beyond the models' knowledge cutoff"
        : `Found ${keyPoints.length} relevant facts`,
      keyPoints,
      modelAgreement: 0.7,
    };
  }

  private calculatePredictionConsensus(
    parsedResponses: ParsedResponse[]
  ): ConsensusResult {
    // Aggregate predictions from all models
    const allPredictions = parsedResponses.flatMap(r => r.predictions || []);
    
    // Use normalizer to group similar predictions
    const normalizer = new PredictionNormalizer();
    const outcomeMap = new Map<string, { totalProb: number; count: number; reasons: string[]; originalNames: string[] }>();
    
    allPredictions.forEach(pred => {
      const normalizedKey = normalizer.normalizeOutcome(pred.outcome, 'sports');
      const existing = outcomeMap.get(normalizedKey) || { totalProb: 0, count: 0, reasons: [], originalNames: [] };
      existing.totalProb += pred.probability;
      existing.count += 1;
      existing.originalNames.push(pred.outcome);
      if (pred.reasoning) existing.reasons.push(pred.reasoning);
      outcomeMap.set(normalizedKey, existing);
    });
    
    // Convert to array and calculate average probabilities
    const aggregatedPredictions = Array.from(outcomeMap.entries())
      .map(([normalizedOutcome, data]) => ({
        outcome: normalizedOutcome,
        probability: data.totalProb / data.count,
        reasoning: data.reasons[0] || undefined, // Use first reasoning
        modelCount: data.count
      }))
      .sort((a, b) => b.probability - a.probability);
    
    // Find most common resolution date
    const resolutionDates = parsedResponses
      .map(r => r.resolutionDate)
      .filter(d => d);
    const resolutionDate = resolutionDates.length > 0 ? resolutionDates[0] : undefined;
    
    // Calculate model agreement based on how closely models agree on probabilities
    const primaryOutcome = aggregatedPredictions[0];
    const modelAgreement = primaryOutcome 
      ? primaryOutcome.modelCount / parsedResponses.length 
      : 0;
    
    // Calculate average confidence
    const avgConfidence = parsedResponses
      .map(r => r.confidence || 0.5)
      .reduce((a, b) => a + b, 0) / parsedResponses.length;
    
    return {
      category: QueryCategory.PREDICTION,
      predictions: aggregatedPredictions.map(p => ({
        outcome: p.outcome,
        probability: p.probability,
        reasoning: p.reasoning
      })),
      resolutionDate,
      confidence: avgConfidence,
      summary: `${parsedResponses.length} models analyzed future outcomes`,
      keyPoints: aggregatedPredictions
        .slice(0, 3)
        .map(p => `${p.outcome}: ${(p.probability * 100).toFixed(0)}%`),
      modelAgreement,
    };
  }

  private extractKeyPoints(responses: ParsedResponse[]): string[] {
    const points = new Set<string>();
    
    responses.forEach(response => {
      // Get first sentence from explanation
      const firstSentence = response.explanation?.match(/^[^.!?]+[.!?]/)?.[0];
      if (firstSentence) points.add(firstSentence.trim());
      
      // Add evidence points
      response.evidence?.forEach(e => points.add(e));
    });
    
    return Array.from(points).slice(0, 5);
  }

  private calculateAgreement(items: string[]): number {
    if (items.length === 0) return 0;
    
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Math.max(...Object.values(counts)) / items.length;
  }
}