import { clsx, type ClassValue } from "clsx";
import { NextResponse } from "next/server";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createErrorResponse(error: unknown, status: number = 500) {
  const message =
    error instanceof Error ? error.message : "Unknown error occurred";
  const details =
    error instanceof Error ? error.stack || String(error) : String(error);
  return NextResponse.json({ error: message, details }, { status });
}

/**
 * Recursively parses rationale JSON, extracting rationale, answer, and confidence if present.
 * Returns an object with rationale, answer, and confidence. If the rationale is not JSON, returns as plain text.
 * Handles various edge cases including incomplete JSON and code blocks.
 */
// Detailed parser returning object with possible answer/confidence
export function parseRationaleDetailed(rawRationale: string | null | undefined): {
  rationale: string;
  answer?: string;
  confidence?: number | string;
} {
  if (!rawRationale) {
    return { rationale: "No rationale provided" };
  }
  
  // Handle OpenRouter prefix "Rationale: { ... }" directly first for robustness
  const orMatch = rawRationale.match(/^\s*Rationale:\s*\{[\s\S]*?"rationale"\s*:\s*"([^"]+)/i);
  if (orMatch && orMatch[1]) {
    return { rationale: orMatch[1].trim() };
  }
  
  try {
    // Clean up the rationale text first
    let cleaned = rawRationale.trim();
    
    // Remove noisy patterns like "**# 1.1.1.1..." that some models (e.g. DeepSeek) prepend
    cleaned = cleaned.replace(/^(?:\*+#+\s*)?(?:\d+\.){5,}\d*\s*/, "");

    // If the cleaned string is extremely long ( > 1500 chars ), truncate for display
    if (cleaned.length > 1500) {
      cleaned = cleaned.slice(0, 1500) + "...";
    }
    
    // Handle markdown code blocks with json syntax highlighting
    if (cleaned.includes("```json") || cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```json\s*|^```\s*|\s*```$/g, "");
    }
    
    // Check for partial JSON by looking for key patterns
    const jsonPattern = /\{\s*"(?:answer|rationale|confidence)"\s*:/i;
    if (jsonPattern.test(cleaned)) {
      // Try to extract a complete JSON object
      const jsonMatch = cleaned.match(/\{[^\}]*\}/); 
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];
          const parsed = JSON.parse(extractedJson);
          
          // If we successfully parsed JSON, extract the fields
          if (parsed) {
            const rationale = parsed.rationale || "";
            const answer = parsed.answer;
            const confidence = parsed.confidence;
            
            // If we have a rationale, use it; otherwise, remove the JSON from the original text
            if (rationale) {
              return { 
                rationale: rationale.trim(), 
                answer, 
                confidence 
              };
            } else {
              // If no rationale in the JSON, remove the JSON from the text
              cleaned = cleaned.replace(jsonMatch[0], "").trim();
            }
          }
        } catch {
          // Failed to parse the extracted JSON, continue with other approaches
        }
      }
    }
    
    // Try to parse the full string as JSON
    try {
      const parsed = JSON.parse(cleaned);
      let rationale = parsed.rationale || "";
      const answer = parsed.answer;
      const confidence = parsed.confidence;
      
      // Handle nested JSON in rationale
      if (typeof rationale === "string") {
        rationale = rationale.trim();
        if (rationale.startsWith("{") && rationale.endsWith("}")) {
          try {
            const inner = JSON.parse(rationale);
            rationale = inner.rationale || rationale;
          } catch {}
        }
      }
      
      return { 
        rationale: rationale || "", 
        answer, 
        confidence 
      };
    } catch {
      // Not valid JSON, use the cleaned text
      return { rationale: cleaned };
    }
  } catch {
    // Fallback to raw rationale if all parsing attempts fail
    return { rationale: rawRationale };
  }
}

// Simple helper returning just the rationale string (backwards compatibility)
export function parseRationale(rawRationale: string | null | undefined): string {
  return parseRationaleDetailed(rawRationale).rationale;
}
