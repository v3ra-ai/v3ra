import type { QueryMode } from "@/lib/types";
import { getFactCheckPrompt } from "@/lib/validators/prompts/fact-check";

export function generatePrompt(
  queryMode: QueryMode | undefined,
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {

  // Always use fact-check mode
  const { systemMessage, userMessage } = getFactCheckPrompt(statement, context);


  return { systemMessage, userMessage };
}