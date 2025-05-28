import { useMemo } from "react";

interface CleanRule {
  pattern: RegExp;
  replacement: string;
}

export function useCleanText(text: string | any | null | undefined): { cleanText: string } {
  // Define cleaning rules
  const rules: CleanRule[] = [
    { pattern: /^.*"rationale"\s*:\s*"/i, replacement: "" },  // Remove OpenRouter JSON prefix
    { pattern: /"\s*\}?\s*$/i, replacement: "" },              // Remove trailing quote and closing brace
    { pattern: /confidence\.?\s*/gi, replacement: "" },
    { pattern: /based on my analysis\s*/gi, replacement: "" },
    { pattern: /i believe\s*/gi, replacement: "" },
    { pattern: /in my opinion\s*/gi, replacement: "" },
    { pattern: /level:\s*\d+\s*Explanation:/gi, replacement: "" },
    { pattern: /Explanation: /gi, replacement: "" },
  ];

  const cleanText = useMemo(() => {
    // Safely derive a string for cleaning
    let rawText: string;
    if (typeof text === "string") {
      rawText = text;
    } else if (text && typeof text.rationale === "string") {
      rawText = text.rationale;
    } else if (text != null) {
      rawText = String(text);
    } else {
      rawText = "";
    }
    // Apply cleaning rules on stringified text
    let cleanedText: string = String(rawText);
    rules.forEach(({ pattern, replacement }) => {
      cleanedText = cleanedText.replace(pattern, replacement);
    });
    return cleanedText.trim();
  }, [text]);

  return { cleanText };
}