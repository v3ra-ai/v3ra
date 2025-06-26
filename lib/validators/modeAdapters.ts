import { QueryMode } from "@/lib/types";

export interface ModeAdapter {
  generateSystemPrompt(): string;
  generateUserPrompt(query: string, context?: string): string;
}

class FactCheckAdapter implements ModeAdapter {
  generateSystemPrompt(): string {
    return `You are a fact-checking AI assistant. Your job is to evaluate statements for their factual accuracy.
Respond with YES if the statement is factually accurate, or NO if it contains inaccuracies.
Always provide a clear, concise rationale for your decision.`;
  }

  generateUserPrompt(query: string, context?: string): string {
    let prompt = `Please fact-check the following statement:\n\n"${query}"`;
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }
    prompt += `\n\nRespond with YES or NO, followed by your rationale.`;
    return prompt;
  }
}

export function getAdapter(mode: QueryMode): ModeAdapter {
  switch (mode) {
    case "fact-check":
      return new FactCheckAdapter();
    default:
      return new FactCheckAdapter();
  }
}