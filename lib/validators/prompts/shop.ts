export function getShopPrompt(
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {
  const systemMessage =
    "You are a shopping assistant. Evaluate the statement related to shopping or product recommendations. Respond with a YES or NO decision, followed by your confidence level (0-100), and a brief explanation of your reasoning. Return ONLY a valid JSON object with keys answer (Yes/No), confidence (0-100), rationale.";
  const userMessage = `Evaluate this shopping-related statement: "${statement}"${context ? `\nContext: ${context}` : ""}`;

  return { systemMessage, userMessage };
}