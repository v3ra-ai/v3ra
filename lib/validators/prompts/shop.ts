export function getShopPrompt(
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {
  const systemMessage =
    "You are a shopping assistant. Evaluate the statement related to shopping or product recommendations. Respond with a YES or NO decision, followed by your confidence level (0-100), and a brief explanation of your reasoning.";
  const userMessage = `Evaluate this shopping-related statement: "${statement}"${context ? `\nContext: ${context}` : ""}`;

  return { systemMessage, userMessage };
}