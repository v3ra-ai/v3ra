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
    const uncertainCount = votes.filter(v => v === "UNCERTAIN").length;
    const totalValidVotes = yesCount + noCount + uncertainCount;

    let consensusValue: boolean | null = null;
    let summary = "";
    let confidence = 0;

    if (totalValidVotes === 0) {
      summary = "No valid responses received";
    } else if (uncertainCount > totalValidVotes / 2) {
      summary = "Too uncertain to fact-check definitively";
      confidence = 0.3;
    } else if (yesCount > noCount * 2) {
      consensusValue = true;
      summary = "Strong consensus: Statement is factually accurate";
      confidence = yesCount / totalValidVotes;
    } else if (noCount > yesCount * 2) {
      consensusValue = false;
      summary = "Strong consensus: Statement contains inaccuracies";
      confidence = noCount / totalValidVotes;
    } else {
      summary = "Mixed responses - no clear consensus";
      confidence = 0.5;
    }

    // Extract key points from explanations
    const keyPoints = this.extractKeyPoints(parsedResponses);

    return {
      category: QueryCategory.FACT_CHECK,
      value: consensusValue,
      confidence,
      summary,
      keyPoints,
      modelAgreement: this.calculateAgreement(votes),
    };
  }

  private calculateQuestionAnswerConsensus(
    parsedResponses: ParsedResponse[]
  ): ConsensusResult {
    // Find common themes in answers
    const allAnswers = parsedResponses.map(r => r.primary).filter(Boolean);
    const allKeyPoints = parsedResponses.flatMap(r => r.evidence || []);
    
    // Simple approach: use the most detailed answer as primary
    const bestAnswer = parsedResponses
      .filter(r => r.confidence && r.confidence > 0.5)
      .sort((a, b) => (b.evidence?.length || 0) - (a.evidence?.length || 0))[0];

    const summary = bestAnswer?.primary || "Multiple answers provided";
    const keyPoints = this.deduplicateKeyPoints(allKeyPoints);
    const agreement = this.calculateSemanticAgreement(allAnswers);

    return {
      category: QueryCategory.QUESTION_ANSWER,
      answer: summary,
      confidence: bestAnswer?.confidence || 0.7,
      summary: `${parsedResponses.length} models provided answers`,
      keyPoints: keyPoints.slice(0, 5),
      modelAgreement: agreement,
    };
  }

  private calculatePerspectivesConsensus(
    parsedResponses: ParsedResponse[],
    category: QueryCategory
  ): ConsensusResult {
    // Collect all perspectives
    const allPerspectives: Perspective[] = parsedResponses
      .flatMap(r => r.perspectives || [])
      .filter(Boolean);

    // Group similar perspectives
    const groupedPerspectives = this.groupPerspectives(allPerspectives);
    
    const summary = category === QueryCategory.IDENTITY_PHILOSOPHY
      ? "This philosophical question has multiple valid interpretations"
      : "This topic involves multiple legitimate viewpoints";

    return {
      category,
      perspectives: groupedPerspectives.slice(0, 5),
      confidence: 0.8,
      summary,
      keyPoints: groupedPerspectives.map(p => p.viewpoint),
      modelAgreement: 0.7, // Perspectives don't require agreement
    };
  }

  private calculateCurrentEventsConsensus(
    parsedResponses: ParsedResponse[]
  ): ConsensusResult {
    const allFacts = parsedResponses.flatMap(r => r.evidence || []);
    const keyFacts = this.deduplicateKeyPoints(allFacts);
    
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
        : `Found ${keyFacts.length} relevant facts`,
      keyPoints: keyFacts.slice(0, 5),
      modelAgreement: this.calculateFactAgreement(parsedResponses),
    };
  }

  private extractKeyPoints(responses: ParsedResponse[]): string[] {
    const points: string[] = [];
    
    for (const response of responses) {
      if (response.explanation) {
        // Extract first sentence or key claim
        const firstSentence = response.explanation.match(/^[^.!?]+[.!?]/)?.[0];
        if (firstSentence && !points.includes(firstSentence)) {
          points.push(firstSentence.trim());
        }
      }
      
      // Add any explicit evidence
      if (response.evidence) {
        points.push(...response.evidence.filter(e => !points.includes(e)));
      }
    }
    
    return points.slice(0, 5);
  }

  private deduplicateKeyPoints(points: string[]): string[] {
    const seen = new Set<string>();
    const unique: string[] = [];
    
    for (const point of points) {
      const normalized = point.toLowerCase().trim();
      if (!seen.has(normalized) && point.length > 10) {
        seen.add(normalized);
        unique.push(point);
      }
    }
    
    return unique;
  }

  private calculateAgreement(votes: string[]): number {
    if (votes.length === 0) return 0;
    
    const counts = votes.reduce((acc, vote) => {
      acc[vote] = (acc[vote] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxCount = Math.max(...Object.values(counts));
    return maxCount / votes.length;
  }

  private calculateSemanticAgreement(answers: string[]): number {
    // Simplified: check if answers contain similar keywords
    if (answers.length < 2) return 1;
    
    const keywords = answers.map(a => 
      a.toLowerCase().split(/\W+/).filter(w => w.length > 3)
    );
    
    let commonCount = 0;
    let totalComparisons = 0;
    
    for (let i = 0; i < keywords.length - 1; i++) {
      for (let j = i + 1; j < keywords.length; j++) {
        const common = keywords[i].filter(k => keywords[j].includes(k));
        commonCount += common.length;
        totalComparisons += Math.max(keywords[i].length, keywords[j].length);
      }
    }
    
    return totalComparisons > 0 ? commonCount / totalComparisons : 0;
  }

  private groupPerspectives(perspectives: Perspective[]): Perspective[] {
    // Simple grouping by similar viewpoints
    const groups = new Map<string, Perspective[]>();
    
    for (const perspective of perspectives) {
      const key = perspective.viewpoint.toLowerCase().slice(0, 30);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(perspective);
    }
    
    // Return the most representative from each group
    return Array.from(groups.values()).map(group => {
      return group.sort((a, b) => 
        b.reasoning.length - a.reasoning.length
      )[0];
    });
  }

  private calculateFactAgreement(responses: ParsedResponse[]): number {
    const facts = responses.flatMap(r => r.evidence || []);
    if (facts.length === 0) return 0;
    
    // Count how many times each fact appears
    const factCounts = facts.reduce((acc, fact) => {
      const normalized = fact.toLowerCase().trim();
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Agreement is based on facts mentioned by multiple models
    const agreedFacts = Object.values(factCounts).filter(count => count > 1).length;
    const uniqueFacts = Object.keys(factCounts).length;
    
    return uniqueFacts > 0 ? agreedFacts / uniqueFacts : 0;
  }
}