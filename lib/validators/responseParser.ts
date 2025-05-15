export interface ParsedModelResponse {
  vote: boolean;        // yes -> true, no -> false, else false
  confidence: number;   // 0‒100
  rationale: string;
}

/**
 * Attempts to parse a model reply which should be strict JSON of the form:
 * {
 *   "answer": "Yes" | "No",
 *   "confidence": <0-100>,
 *   "rationale": "..."
 * }
 *
 * If parsing fails or the expected keys are missing we treat the whole reply
 * as an opaque string, set vote = false and confidence = 0 so the caller can
 * still surface an explanation.
 */
export function parseLLMReply(text: string): ParsedModelResponse {
  try {
    // Try to parse JSON from potentially incomplete response
    const data = JSON.parse(text.trim());

    // Extract vote first - this is the most critical field
    const voteRaw = (data?.answer ?? "").toString();
    // If we have an answer, honor it regardless of other fields
    const vote = /^yes$/i.test(voteRaw)
      ? true
      : /^no$/i.test(voteRaw)
      ? false
      : false; // treat non-yes as false for simplicity

    // Extract confidence, defaulting to 50 if missing
    const confidenceRaw = Number(data?.confidence);
    const confidence = isFinite(confidenceRaw)
      ? Math.max(0, Math.min(100, confidenceRaw))
      : 50; // Use a moderate default confidence value

    // Extract rationale, using raw text as fallback
    const rationale = data?.rationale !== undefined 
      ? data.rationale.toString() 
      : text.trim(); // Use raw text if rationale missing

    return { vote, confidence, rationale: rationale.trim() };
  } catch (error) {
    console.log("Failed to parse LLM response:", error);
    
    // Attempt to extract vote from non-JSON text
    // Look for keywords in the raw text to determine vote
    const hasYes = /"answer"\s*:\s*"yes"/i.test(text);
    
    // If we can extract a vote from malformed JSON, use it
    if (hasYes) {
      return {
        vote: true,  // Found "answer": "yes" pattern
        confidence: 50,
        rationale: text.trim(),
      };
    }
    
    // Fallback when parsing fails – preserve the raw text
    // If the response is empty or only whitespace, provide a more descriptive rationale
    const trimmed = text.trim();
    return {
      vote: false,
      confidence: 0,
      rationale: trimmed.length === 0 ? "No response received from model." : trimmed,
    };

  }
}
