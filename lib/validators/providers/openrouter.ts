import { AIValidator, ValidationRequest, AIValidationResponse } from "../types";
import type { QueryMode } from "@/lib/types";

export class OpenRouterValidator implements AIValidator {
  id: string;
  name: string;
  provider = "OpenRouter";
  modelName: string;
  active: boolean;
  private apiKey: string;
  queryMode: QueryMode; // Keep as QueryMode for type safety

  constructor(opts: { id: string; name: string; modelName: string; active: boolean; queryMode?: QueryMode }) {
    this.id = opts.id;
    this.name = opts.name;
    this.modelName = opts.modelName;
    this.active = opts.active;
    this.queryMode = opts.queryMode || "factCheck"; // Default to factCheck

    const envApiKey = process.env.OPENROUTER_API_KEY;
    if (!envApiKey) {
      console.error("CRITICAL: OPENROUTER_API_KEY is not set in environment variables.");
      throw new Error("OPENROUTER_API_KEY is not set in environment variables.");
    }
    this.apiKey = envApiKey;
  }

  async validate(req: ValidationRequest): Promise<AIValidationResponse> {
    if (!this.apiKey) {
      console.error("OpenRouterValidator: API key is missing. Cannot validate.");
      return {
        vote: false,
        confidence: 0,
        rationale: "OpenRouter API key is not configured for this validator.",
        providerName: this.provider,
        modelName: this.modelName,
      };
    }

    console.log(`OpenRouterValidator validating statement: "${req.statement}" with model ${this.modelName} in mode ${this.queryMode}`);

    try {
      const startTime = Date.now();

      // Construct system prompt based on queryMode
      const systemPrompt = this.queryMode === "predict"
        ? "You are a prediction assistant. Predict the likelihood of the statement being true in the future. Respond with only the word 'true' or 'false', followed by a brief rationale."
        : "You are a fact-checking assistant. Determine if the following statement is true or false. Respond with only the word 'true' or 'false', followed by a brief rationale.";

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: req.statement },
          ],
          temperature: 0.3,
          max_tokens: 50,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `OpenRouter API error: ${response.status} ${response.statusText}`,
          errorBody
        );
        return {
          vote: false,
          confidence: 0,
          rationale: `OpenRouter API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`,
          providerName: this.provider,
          modelName: this.modelName,
        };
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      let vote = false;
      let confidence = 0.5;
      let rationale = "Could not reliably determine validation outcome from model response.";

      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const messageContent = data.choices[0].message.content.trim();
        rationale = messageContent;

        const firstWord = messageContent.split(' ')[0].toLowerCase();
        if (firstWord.startsWith("true")) {
          vote = true;
          confidence = 0.8;
        } else if (firstWord.startsWith("false")) {
          vote = false;
          confidence = 0.8;
        }
      }

      return {
        vote,
        confidence,
        rationale,
        providerName: this.provider,
        modelName: this.modelName,
        latency,
      };
    } catch (error) {
      console.error("Error in OpenRouterValidator validate method:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown validation error";
      return {
        vote: false,
        confidence: 0.0,
        rationale: `Validation failed due to an unexpected error: ${errorMessage}`,
        providerName: this.provider,
        modelName: this.modelName,
        latency: 0,
      };
    }
  }
}