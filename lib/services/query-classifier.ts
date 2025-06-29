import { QueryCategory, QueryClassification } from "@/lib/types/query-classifier";

export class QueryClassifier {
  private static readonly PATTERNS = {
    // Fact check patterns
    factCheck: {
      patterns: [
        /^(the|a|an)\s+\w+\s+(is|are|was|were|has|have|had)/i,
        /^[A-Z][^?]+\s+(is|are|was|were|has|have|had)\s+/,
        /claims?\s+that/i,
        /it is (true|false) that/i,
      ],
      keywords: ["true", "false", "fact", "actually", "really"],
    },
    
    // Question patterns
    questionAnswer: {
      patterns: [
        /^(what|how|why|when|where|who|which|whose|whom)\s+/i,
        /\?$/,
        /^(can|could|would|should|will|do|does|did|is|are|was|were)\s+.*\?$/i,
      ],
      keywords: ["explain", "describe", "define", "mean", "work"],
    },
    
    // Identity/Philosophy patterns
    identityPhilosophy: {
      patterns: [
        /(who|what)\s+am\s+i/i,
        /meaning\s+of\s+(life|existence|being)/i,
        /purpose\s+of\s+(life|existence|humanity)/i,
        /consciousness|existence|identity|soul|spirit/i,
      ],
      keywords: ["philosophy", "existence", "consciousness", "meaning", "purpose", "identity"],
    },
    
    // Current events patterns
    currentEvents: {
      patterns: [
        /\b(today|yesterday|this\s+week|this\s+month|this\s+year)\b/i,
        /\b(latest|current|recent|now|ongoing)\b/i,
        /\b20\d{2}\b/, // Year patterns
        /(news|update|happening|occurred)/i,
      ],
      keywords: ["latest", "current", "today", "news", "update", "recent"],
    },
    
    // Opinion/Debate patterns
    opinionDebate: {
      patterns: [
        /\b(should|ought|better|worse|best|worst)\b/i,
        /\b(good|bad|right|wrong|ethical|moral)\b/i,
        /vs\.?|versus|compared?\s+to/i,
        /opinion|perspective|view|debate/i,
      ],
      keywords: ["should", "better", "opinion", "believe", "think", "ethical", "moral"],
    },
  };

  classify(query: string): QueryClassification {
    const normalizedQuery = query.toLowerCase().trim();
    const scores: Record<QueryCategory, number> = {
      [QueryCategory.FACT_CHECK]: 0,
      [QueryCategory.QUESTION_ANSWER]: 0,
      [QueryCategory.IDENTITY_PHILOSOPHY]: 0,
      [QueryCategory.CURRENT_EVENTS]: 0,
      [QueryCategory.OPINION_DEBATE]: 0,
    };

    // Check for question marks first (strong indicator)
    if (query.trim().endsWith("?")) {
      scores[QueryCategory.QUESTION_ANSWER] += 30;
      
      // Check if it's a philosophical question
      if (this.matchesPatterns(normalizedQuery, this.PATTERNS.identityPhilosophy)) {
        scores[QueryCategory.IDENTITY_PHILOSOPHY] += 40;
      }
    }

    // Score each category
    for (const [category, config] of Object.entries(this.PATTERNS)) {
      const categoryKey = this.getCategoryFromString(category);
      
      // Pattern matching
      for (const pattern of config.patterns) {
        if (pattern.test(normalizedQuery)) {
          scores[categoryKey] += 20;
        }
      }
      
      // Keyword matching
      for (const keyword of config.keywords) {
        if (normalizedQuery.includes(keyword)) {
          scores[categoryKey] += 10;
        }
      }
    }

    // Special case adjustments
    this.applySpecialCases(normalizedQuery, scores);

    // Find highest scoring category
    let maxScore = 0;
    let selectedCategory = QueryCategory.FACT_CHECK;
    let totalScore = 0;

    for (const [category, score] of Object.entries(scores)) {
      totalScore += score;
      if (score > maxScore) {
        maxScore = score;
        selectedCategory = category as QueryCategory;
      }
    }

    // Calculate confidence
    const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1) : 0.5;

    // Get reasoning and suggestions
    const { reasoning, suggestedRephrasing } = this.getClassificationDetails(
      query,
      selectedCategory,
      confidence
    );

    return {
      category: selectedCategory,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      suggestedRephrasing,
      keywords: this.extractKeywords(normalizedQuery),
    };
  }

  private matchesPatterns(text: string, config: { patterns: RegExp[], keywords: string[] }): boolean {
    return config.patterns.some(pattern => pattern.test(text)) ||
           config.keywords.some(keyword => text.includes(keyword));
  }

  private getCategoryFromString(str: string): QueryCategory {
    const mapping: Record<string, QueryCategory> = {
      factCheck: QueryCategory.FACT_CHECK,
      questionAnswer: QueryCategory.QUESTION_ANSWER,
      identityPhilosophy: QueryCategory.IDENTITY_PHILOSOPHY,
      currentEvents: QueryCategory.CURRENT_EVENTS,
      opinionDebate: QueryCategory.OPINION_DEBATE,
    };
    return mapping[str] || QueryCategory.FACT_CHECK;
  }

  private applySpecialCases(query: string, scores: Record<QueryCategory, number>): void {
    // Questions about facts still get some fact-check score
    if (query.includes("is it true") || query.includes("fact that")) {
      scores[QueryCategory.FACT_CHECK] += 25;
    }

    // Temporal questions about facts
    if ((query.includes("when") || query.includes("date")) && 
        !query.includes("opinion")) {
      scores[QueryCategory.CURRENT_EVENTS] += 15;
    }

    // Comparative questions often involve opinions
    if (query.includes("better than") || query.includes("vs") || 
        query.includes("compared to")) {
      scores[QueryCategory.OPINION_DEBATE] += 20;
    }
  }

  private extractKeywords(query: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "was", "are", "were", "been"
    ]);
    
    return query
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5);
  }

  private getClassificationDetails(
    query: string,
    category: QueryCategory,
    confidence: number
  ): { reasoning: string; suggestedRephrasing?: string } {
    const details: Record<QueryCategory, { reasoning: string; suggestedRephrasing?: string }> = {
      [QueryCategory.FACT_CHECK]: {
        reasoning: "This appears to be a factual claim that can be verified.",
        suggestedRephrasing: confidence < 0.7 ? 
          `Try rephrasing as a clear statement, e.g., "The Earth orbits the Sun"` : undefined
      },
      [QueryCategory.QUESTION_ANSWER]: {
        reasoning: "This is a question seeking information or explanation.",
        suggestedRephrasing: undefined
      },
      [QueryCategory.IDENTITY_PHILOSOPHY]: {
        reasoning: "This touches on philosophical or existential themes.",
        suggestedRephrasing: undefined
      },
      [QueryCategory.CURRENT_EVENTS]: {
        reasoning: "This relates to current or recent events.",
        suggestedRephrasing: confidence < 0.7 ?
          `Try adding a specific timeframe, e.g., "What happened in [place] on [date]?"` : undefined
      },
      [QueryCategory.OPINION_DEBATE]: {
        reasoning: "This involves subjective judgment or comparison.",
        suggestedRephrasing: undefined
      }
    };

    return details[category] || { reasoning: "Classification uncertain" };
  }
}