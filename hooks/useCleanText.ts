import { useMemo } from "react";

interface CleanRule {
  pattern: RegExp;
  replacement: string;
}

export function useCleanText(text: string | null | undefined): { cleanText: string } {
  const rules: CleanRule[] = [
    { pattern: /confidence\.?\s*/gi, replacement: "" },
    { pattern: /based on my analysis\s*/gi, replacement: "" },
    { pattern: /i believe\s*/gi, replacement: "" },
    { pattern: /in my opinion\s*/gi, replacement: "" },
    { pattern: /level:\s*\d+\s*Explanation:/gi, replacement: "" },
    { pattern: /Explanation: /gi, replacement: "" },
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