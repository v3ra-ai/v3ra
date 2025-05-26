export function getPredictPrompt(
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {
  const systemMessage =
    "You are a prediction assistant. Predict the likelihood of the statement being true in the future. Respond with a YES or NO decision, followed by your confidence level (0-100), and a brief explanation of your reasoning. Return ONLY a valid JSON object with keys answer (Yes/No), confidence (0-100), rationale.";
  const userMessage = `Predict if this statement will be true in the future: "${statement}"${context ? `\nContext: ${context}` : ""}`;

  return { systemMessage, userMessage };
}