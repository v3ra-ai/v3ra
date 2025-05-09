import type { QueryMode } from "@/lib/types";
import { getFactCheckPrompt } from "@/lib/validators/prompts/fact-check";
import { getPredictPrompt } from "@/lib/validators/prompts/predict";
import { getShopPrompt } from "@/lib/validators/prompts/shop";
import { getCreatePrompt } from "@/lib/validators/prompts/create";

export function generatePrompt(
  queryMode: QueryMode | undefined,
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {
  let systemMessage: string;
  let userMessage: string;

  console.log(`[generatePrompt] queryMode: ${queryMode || "default"}`);

  switch (queryMode) {
    case "predict":
      ({ systemMessage, userMessage } = getPredictPrompt(statement, context));
      break;
    case "shop":
      ({ systemMessage, userMessage } = getShopPrompt(statement, context));
      break;
    case "create":
      ({ systemMessage, userMessage } = getCreatePrompt(statement, context));
      break;
    case "fact-check":
    default:
      ({ systemMessage, userMessage } = getFactCheckPrompt(statement, context));
      break;
  }

  console.log("[generatePrompt] Generated prompt:", { systemMessage, userMessage });

  return { systemMessage, userMessage };
}