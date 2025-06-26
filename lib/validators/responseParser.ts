export interface ParsedVote {
  decision: boolean;
  rationale: string;
  confidence?: number;
}

export function parseLLMReply(response: string): ParsedVote {
  // Parser for LLM responses - expects YES/NO at the start
  
  const trimmedResponse = response.trim();
  const normalizedResponse = trimmedResponse.toUpperCase();
  let decision = false;
  let rationale = "";
  let confidence = 0.8; // Default confidence
  
  // Check for YES/NO at the beginning (with possible punctuation)
  if (normalizedResponse.match(/^YES[\s,.:;]/) || normalizedResponse === "YES") {
    decision = true;
    // Extract rationale after YES and any punctuation/whitespace
    rationale = trimmedResponse.replace(/^YES[\s,.:;]*/i, "").trim();
    confidence = 0.85; // Higher confidence for clear format
  } else if (normalizedResponse.match(/^NO[\s,.:;]/) || normalizedResponse === "NO") {
    decision = false;
    // Extract rationale after NO and any punctuation/whitespace
    rationale = trimmedResponse.replace(/^NO[\s,.:;]*/i, "").trim();
    confidence = 0.85; // Higher confidence for clear format
  } else {
    // Fallback: Try to infer from content keywords
    const positiveKeywords = ["TRUE", "CORRECT", "ACCURATE", "FACTUAL", "VALID", "CONFIRMED"];
    const negativeKeywords = ["FALSE", "INCORRECT", "INACCURATE", "WRONG", "UNTRUE", "INVALID"];
    
    const hasPositive = positiveKeywords.some(keyword => normalizedResponse.includes(keyword));
    const hasNegative = negativeKeywords.some(keyword => normalizedResponse.includes(keyword));
    
    if (hasPositive && !hasNegative) {
      decision = true;
      confidence = 0.7; // Lower confidence for inferred response
    } else if (hasNegative && !hasPositive) {
      decision = false;
      confidence = 0.7; // Lower confidence for inferred response
    } else {
      // Default to false if ambiguous
      decision = false;
      confidence = 0.5; // Very low confidence
    }
    
    rationale = trimmedResponse;
  }
  
  // Clean up rationale - remove leading punctuation/whitespace
  rationale = rationale.replace(/^[:\-\s]+/, "").trim();
  
  return {
    decision,
    rationale: rationale || "No explanation provided",
    confidence
  };
}