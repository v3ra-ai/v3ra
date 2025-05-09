export function getCreatePrompt(
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {
  const systemMessage =
    "You are a creative assistant. Assess the feasibility or creativity of the statement. Respond with a YES or NO decision, followed by your confidence level (0-100), and a brief explanation of your reasoning.";
  const userMessage = `Assess the creative feasibility of this statement: "${statement}"${context ? `\nContext: ${context}` : ""}`;

  return { systemMessage, userMessage };
}