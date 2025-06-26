export interface ParsedVote {
  decision: boolean;
  rationale: string;
  confidence?: number;
}

export function parseLLMReply(response: string): ParsedVote {
  // Simple parser for LLM responses
  // Expected format: YES/NO followed by rationale
  
  const normalizedResponse = response.trim().toUpperCase();
  let decision = false;
  let rationale = response;
  
  if (normalizedResponse.startsWith("YES")) {
    decision = true;
    rationale = response.substring(3).trim();
  } else if (normalizedResponse.startsWith("NO")) {
    decision = false;
    rationale = response.substring(2).trim();
  } else {
    // Try to infer from content
    if (normalizedResponse.includes("TRUE") || normalizedResponse.includes("CORRECT") || normalizedResponse.includes("ACCURATE")) {
      decision = true;
    }
  }
  
  // Clean up rationale
  rationale = rationale.replace(/^[:\-\s]+/, "").trim();
  
  return {
    decision,
    rationale: rationale || "No explanation provided",
    confidence: 0.8 // Default confidence
  };
}