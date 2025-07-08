import { QueryCategory, QueryClassification } from "@/lib/types/query-classifier";

export class QueryClassifier {
  classify(query: string): QueryClassification {
    const q = query.toLowerCase().trim();
    
    // Quick checks for obvious categories
    if (this.isPrediction(q)) {
      return this.result(QueryCategory.PREDICTION, 0.9);
    }
    
    if (this.isQuestion(q)) {
      // Philosophy mode is now manually selected by the user
      return this.result(QueryCategory.QUESTION_ANSWER, 0.85);
    }
    
    if (this.isOpinion(q)) {
      return this.result(QueryCategory.OPINION_DEBATE, 0.8);
    }
    
    if (this.isCurrentEvent(q)) {
      return this.result(QueryCategory.CURRENT_EVENTS, 0.8);
    }
    
    // Default to fact check for declarative statements
    return this.result(QueryCategory.FACT_CHECK, 0.75);
  }

  private isQuestion(q: string): boolean {
    return q.endsWith("?") || /^(what|how|why|when|where|who|which|can|could|would|should|will|do|does|did|is|are)\s/i.test(q);
  }

  // Philosophy mode is now manually selected by the user
  // Removed automatic philosophical question detection

  private isOpinion(q: string): boolean {
    return /(should|better|worse|best|worst|opinion|vs|versus|compared to)/i.test(q);
  }

  private isCurrentEvent(q: string): boolean {
    return /(today|yesterday|latest|current|recent|news|happening|20\d{2})/i.test(q);
  }

  private isPrediction(q: string): boolean {
    // Check for future-oriented keywords
    const hasFutureIndicator = /(will|going to|predict|forecast|expect|likely|probably|chance|odds|bet|next year|next month|202[5-9]|203[0-9]|future)/i.test(q);
    
    // Check for prediction contexts (expanded list)
    const hasPredictionContext = /(win|lose|happen|occur|reach|achieve|become|defeat|beat|price|value|election|championship|award|market|super bowl|superbowl|world cup|olympics|president|stock|bitcoin|crypto)/i.test(q);
    
    // Also catch "who will" and "what will" patterns even with typos
    const hasWillPattern = /\b(who|what|which|when|where)\s+will\b/i.test(q);
    
    return (hasFutureIndicator && hasPredictionContext) || hasWillPattern;
  }

  private result(category: QueryCategory, confidence: number): QueryClassification {
    return {
      category,
      confidence,
      reasoning: this.getReasoning(category),
    };
  }

  private getReasoning(category: QueryCategory): string {
    const reasons = {
      [QueryCategory.FACT_CHECK]: "This appears to be a factual claim",
      [QueryCategory.QUESTION_ANSWER]: "This is a question seeking information",
      [QueryCategory.IDENTITY_PHILOSOPHY]: "This is a philosophical inquiry",
      [QueryCategory.CURRENT_EVENTS]: "This relates to current or recent events",
      [QueryCategory.OPINION_DEBATE]: "This involves subjective judgment",
      [QueryCategory.PREDICTION]: "This is a prediction about a future event",
    };
    return reasons[category];
  }
}