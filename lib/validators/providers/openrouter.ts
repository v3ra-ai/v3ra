import { AIValidator, ValidationRequest, AIValidationResponse, AdaptiveValidationRequest } from "../types";
import type { QueryMode } from "@/lib/types";
import { generatePrompt } from "../utils";
import { parseLLMReply as parseVote } from "../responseParser";
import { createLogger } from "@/lib/logger";

const logger = createLogger('openrouter-validator');
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
      return envKey;
    }


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

  async validate(req: ValidationRequest | AdaptiveValidationRequest): Promise<AIValidationResponse> {
    // Get API key dynamically
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      logger.error(
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

    try {
      const startTime = Date.now();

      // Determine prompts based on request type
      let systemMessage: string;
      let userMessage: string;
      
      if ('systemMessage' in req) {
        // Adaptive request
        systemMessage = req.systemMessage;
        userMessage = req.userMessage;
      } else {
        // Regular request
        const prompt = generatePrompt(
          req.queryMode,
          req.statement,
          req.context
        );
        systemMessage = prompt.systemMessage;
        userMessage = prompt.userMessage;
      }

      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://v3ra.app",
              "X-Title": "V3RA Blind Testing",
            },
            body: JSON.stringify({
              model: this.modelName,
              messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage },
              ],
              temperature: 0.3,
              max_tokens: 500, // Reduced for faster responses
              stream: false,
            }),
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
        logger.error(
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
        
        // For adaptive requests, return raw response
        if ('systemMessage' in req) {
          vote = content.toUpperCase().startsWith("YES");
          confidence = 0.85;
          rationale = content;
        } else {
          // Use the standard parser for regular requests
          const parsed = parseVote(content);
          vote = parsed.decision;
          confidence = parsed.confidence || 0.8;
          rationale = parsed.rationale;
        }
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
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          logger.error('OpenRouter API timeout after 15 seconds');
          return {
            vote: false,
            confidence: 0,
            rationale: "Request timed out after 15 seconds",
            providerName: this.provider,
            modelName: this.modelName,
            latency: 15000,
          };
        }
        throw fetchError;
      }
    } catch (error) {
      logger.error('Error in OpenRouterValidator validate method', error);
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
