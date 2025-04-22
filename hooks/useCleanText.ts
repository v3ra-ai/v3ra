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
  ];

  const cleanText = useMemo(() => {
    if (!text) return "";
    let result = text;
    rules.forEach(({ pattern, replacement }) => {
      result = result.replace(pattern, replacement);
    });
    return result.trim();
  }, [text]);

  return { cleanText };
}