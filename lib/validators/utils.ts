import type { QueryMode } from "@/lib/types";

export function generatePrompt(
  queryMode: QueryMode | undefined,
  statement: string,
  context?: string
): { systemMessage: string; userMessage: string } {
  let systemMessage: string;
  let userMessage: string;

  if (queryMode === "predict") {
    console.log(`queryMode === "predict"`);

    systemMessage =
      "You are a prediction assistant. Predict the likelihood of the statement being true in the future. Respond with a YES or NO decision, followed by your confidence level (0-100), and a brief explanation of your reasoning.";
    userMessage = `Predict if this statement will be true in the future: "${statement}"${context ? `\nContext: ${context}` : ""}`;

    console.log(systemMessage,userMessage);

  } else {
    console.log(`queryMode === "default"`);
    // Default to factCheck for all other modes or if queryMode is undefined
    systemMessage =
      "You are a fact-checking assistant. Determine if the statement is factually accurate. Respond with a YES or NO decision, followed by your confidence level (0-100), and a brief explanation of your reasoning.";
    userMessage = `Is this statement factually accurate? "${statement}"${context ? `\nContext: ${context}` : ""}`;

    console.log(systemMessage,userMessage);
  }

  return { systemMessage, userMessage };
}