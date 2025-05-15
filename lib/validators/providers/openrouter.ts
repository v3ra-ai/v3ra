import { AIValidator, ValidationRequest, AIValidationResponse } from "../types";
import type { QueryMode } from "@/lib/types";
import { generatePrompt } from "../utils";
import { parseLLMReply as parseVote } from "../responseParser";
import { getAdapter } from "../modeAdapters";

export class OpenRouterValidator implements AIValidator {
  id: string;
  name: string;
  provider = "OpenRouter"; // Ensure this matches the string used in the database and registry
  modelName: string;
  active: boolean;
  private apiKey: string;
  queryMode: QueryMode; // Keep as QueryMode for type safety

  constructor(opts: {
    id: string;
    name: string;
    modelName: string;
    active: boolean;
    queryMode?: QueryMode;
  }) {
    this.id = opts.id;
    this.name = opts.name;
    this.modelName = opts.modelName;
    this.active = opts.active;
    this.queryMode = opts.queryMode || "fact-check"; // Default to factCheck

    const envApiKey = process.env.OPENROUTER_API_KEY;
    if (!envApiKey) {
      console.error(
        "CRITICAL: OPENROUTER_API_KEY is not set in environment variables."
      );
      throw new Error(
        "OPENROUTER_API_KEY is not set in environment variables."
      );
    }
    this.apiKey = envApiKey;
  }

  async validate(req: ValidationRequest): Promise<AIValidationResponse> {
    if (!this.apiKey) {
      // This case should ideally be prevented by the constructor check,
      // but as a safeguard:
      console.error(
        "OpenRouterValidator: API key is missing. Cannot validate."
      );
      return {
        vote: false,
        confidence: 0,
        rationale: "OpenRouter API key is not configured for this validator.",
        providerName: this.provider,
        modelName: this.modelName,
      };
    }

    console.log(
      `OpenRouterValidator validating statement: "${req.statement}" with model ${this.modelName} in mode ${req.queryMode || "fact-check"}`
    );

    try {
      const startTime = Date.now();

      // Generate prompt using utility function
      const { systemMessage, userMessage } = generatePrompt(
        req.queryMode,
        req.statement,
        req.context
      );

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            // Optional: Add other headers OpenRouter might recommend
            // "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL, // Your site URL
            // "X-Title": process.env.NEXT_PUBLIC_APP_NAME, // Your app name
          },
          body: JSON.stringify({
            model: this.modelName, // e.g., "openai/gpt-3.5-turbo"
            messages: [
              // Basic system prompt for validation, can be enhanced
              { role: "system", content: systemMessage },
              { role: "user", content: userMessage },
            ],
            // temperature: 0.3, // Example: make it less random
            // max_tokens: 50,   // Example: limit response length for validation
            temperature: 0.3,
            max_tokens: 50,
          }),
        }
      );

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

      let vote: boolean;
      let confidence: number;
      let rationale: string;

      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const rawContent = data.choices[0].message.content;
        console.log(`[OpenRouter - ${this.modelName}] Raw response content:`, rawContent);
        const content = rawContent.trim();
        console.log(`[OpenRouter - ${this.modelName}] Trimmed content:`, content);
        const parsed = parseVote(content);
        console.log(`[OpenRouter - ${this.modelName}] Parsed reply object:`, parsed);
        const { vote: v, confidence: c, rationale: r } = getAdapter(req.queryMode).interpret(parsed);
        vote = v;
        confidence = c;
        rationale = r;
      } else {
        vote = false;
        confidence = 0;
        rationale = "Empty response from model.";
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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown validation error";
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
