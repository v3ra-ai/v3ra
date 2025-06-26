import { AIValidator, ValidationRequest, AIValidationResponse } from "../types";
import type { QueryMode } from "@/lib/types";
import { generatePrompt } from "../utils";
import { parseLLMReply as parseVote } from "../responseParser";
import { keyService } from "../../services/keyService";

export class OpenRouterValidator implements AIValidator {
  id: string;
  name: string;
  provider = "OpenRouter"; // Ensure this matches the string used in the database and registry
  modelName: string;
  active: boolean;
  keyId?: string;
  queryMode: QueryMode; // Keep as QueryMode for type safety

  constructor(opts: {
    id: string;
    name: string;
    modelName: string;
    active: boolean;
    queryMode?: QueryMode;
    keyId?: string;
  }) {
    this.id = opts.id;
    this.name = opts.name;
    this.modelName = opts.modelName;
    this.active = opts.active;
    this.queryMode = opts.queryMode || "fact-check"; // Default to factCheck
    this.keyId = opts.keyId;
  }

  /**
   * Get an API key for this validator
   */
  private async getApiKey(): Promise<string | null> {
    // Use environment variable directly instead of key service
    const envKey = process.env.OPENROUTER_API_KEY;
    if (envKey) {
      console.log("Using OpenRouter API key from environment variable");
      return envKey;
    }

    console.log("Environment variable not found, falling back to key service");

    // Fall back to key service only if env variable isn't available
    if (this.keyId) {
      const key = await keyService.getDecryptedKey(this.keyId);
      if (key) return key;
    }

    const keyData = await keyService.getFirstActiveKeyForProvider("OpenRouter");
    if (keyData) {
      this.keyId = keyData.id;
      return keyData.key;
    }
    return null;
  }

  async validate(req: ValidationRequest): Promise<AIValidationResponse> {
    // Get API key dynamically
    const apiKey = await this.getApiKey();
    if (!apiKey) {
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
            Authorization: `Bearer ${apiKey}`,
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
            max_tokens: 1000
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
        const content = data.choices[0].message.content;
        console.log(`[OpenRouter - ${this.modelName}] Raw response:`, content);
        
        // Use the standard parser which handles YES/NO format
        const parsed = parseVote(content);
        console.log(`[OpenRouter - ${this.modelName}] Parsed response:`, parsed);
        
        vote = parsed.decision;
        confidence = parsed.confidence || 0.8;
        rationale = parsed.rationale;
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
