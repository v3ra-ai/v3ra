import type { QueryMode } from "@/lib/types";

export function generatePrompt(
  queryMode: QueryMode | undefined,
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {

  // Open-ended response mode - no fact checking
  const systemMessage = `You are a helpful AI assistant. Provide thoughtful, nuanced responses to any question or topic. 
Be informative, balanced, and engaging. You can discuss any topic including creative, philosophical, technical, or general questions.`;

  let userMessage = statement;
  
  if (context) {
    userMessage += `\n\nContext: ${context}`;
  }

  return { systemMessage, userMessage };
}