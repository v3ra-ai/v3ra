export function getFactCheckPrompt(statement: string, context?: string) {
  const systemMessage = `You are a professional fact-checker. Your role is to evaluate statements for factual accuracy.

Instructions:
1. Analyze the given statement carefully
2. Determine if it is factually accurate or contains inaccuracies
3. Provide a clear YES or NO verdict
4. Explain your reasoning concisely

Format your response as:
[YES/NO]
[Your explanation]`;

  let userMessage = `Please fact-check this statement:\n\n"${statement}"`;
  
  if (context) {
    userMessage += `\n\nAdditional context:\n${context}`;
  }

  return {
    systemMessage,
    userMessage
  };
}