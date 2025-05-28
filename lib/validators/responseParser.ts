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
  // Clean the input text first
  const cleanText = text.trim();
  
  // Handle the case where the response starts with "Rationale: {" (OpenRouter specific)
  // Using [\s\S] instead of . with s flag for better compatibility
  const jsonMatch = cleanText.match(/^Rationale:\s*(\{[\s\S]*\})/);
  const jsonText = jsonMatch ? jsonMatch[1] : cleanText;
  
  try {
    // Try to parse the cleaned JSON text
    const data = JSON.parse(jsonText);

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
    let rationale = data?.rationale !== undefined 
      ? data.rationale.toString() 
      : (data?.explanation || text.trim()); // Use explanation or raw text if rationale missing
      
    // Further clean up the rationale - check if it contains JSON
    if (typeof rationale === 'string' && rationale.includes('{') && rationale.includes('"rationale"')) {
      try {
        // Try to extract embedded JSON from rationale
        const match = rationale.match(/\{[\s\S]*\}/);
        if (match) {
          const embeddedJson = JSON.parse(match[0]);
          if (embeddedJson.rationale) {
            rationale = embeddedJson.rationale.toString();
          }
        }
      } catch {
        // If JSON parsing fails, keep the original rationale
      }
    }
    
    // Remove any remaining markdown or JSON formatting
    rationale = rationale.replace(/```json|```/g, '').trim();

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
    
    // Fallback when parsing fails – try to extract just the rationale text if possible
    const trimmed = cleanText.trim();
    
    // If the response starts with "Rationale: " but isn't valid JSON, try to extract just the text after it
    // Using [\s\S] instead of . with s flag for better compatibility
    const rationaleMatch = trimmed.match(/^Rationale:[\s\n]*([\s\S]*)$/);
    const fallbackRationale = rationaleMatch ? 
      rationaleMatch[1].trim() : 
      (trimmed.length === 0 ? "No response received from model." : trimmed);
      
    return {
      vote: false,
      confidence: 0,
      rationale: fallbackRationale,
    };

  }
}
