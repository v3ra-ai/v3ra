export interface ParsedVote {
  decision: boolean;
  rationale: string;
  confidence?: number;
}

export function parseLLMReply(response: string): ParsedVote {
  // For blind testing, we don't need YES/NO parsing
  // Just return the full response as the rationale
  
  const trimmedResponse = response.trim();
  
  // Remove any YES/NO/UNKNOWN prefix if it exists (for backwards compatibility)
  let cleanedResponse = trimmedResponse;
  if (cleanedResponse.match(/^(YES|NO|UNKNOWN)[\s,.:;]/i)) {
    cleanedResponse = cleanedResponse.replace(/^(YES|NO|UNKNOWN)[\s,.:;]*/i, "").trim();
  }
  
  return {
    decision: true, // Default to true for blind testing
    rationale: cleanedResponse || response || "No response provided",
    confidence: 0.9 // High confidence since we're not fact-checking
  };
}