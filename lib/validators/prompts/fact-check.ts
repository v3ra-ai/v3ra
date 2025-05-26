export function getFactCheckPrompt(
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {
  const systemMessage =
    "You are a fact-checking assistant. Determine if the statement is factually accurate. Respond with a YES or NO decision, followed by your confidence level (0-100), and a brief explanation of your reasoning. Return ONLY a valid JSON object with keys answer (Yes/No), confidence (0-100), rationale.";
  const userMessage = `Is this statement factually accurate? "${statement}"${context ? `\nContext: ${context}` : ""}`;

  return { systemMessage, userMessage };
}