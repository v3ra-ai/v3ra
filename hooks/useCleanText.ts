import { useMemo } from "react";

interface CleanRule {
  pattern: RegExp;
  replacement: string;
}

export function useCleanText(text: string | null | undefined): { cleanText: string } {
  const rules: CleanRule[] = [
    // Remove "confidence" mentions to avoid opinionated phrasing
    { pattern: /confidence\.?\s*/gi, replacement: "" },
    // Remove analysis disclaimers for concise output
    { pattern: /based on my analysis\s*/gi, replacement: "" },
    // Remove personal belief statements for neutrality
    { pattern: /i believe\s*/gi, replacement: "" },
    // Remove opinion qualifiers for clarity
    { pattern: /in my opinion\s*/gi, replacement: "" },
  ];

  const cleanText = useMemo(() => {
    if (!text) return "";
    let cleanedText = text;
    rules.forEach(({ pattern, replacement }) => {
      cleanedText = cleanedText.replace(pattern, replacement);
    });
    return cleanedText.trim();
  }, [text]);

  return { cleanText };
}