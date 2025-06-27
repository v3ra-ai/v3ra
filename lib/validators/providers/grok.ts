import { v4 as uuidv4 } from "uuid";
import { AIValidator, AIValidationResponse, ValidationRequest } from "../types";
import { keyService } from "../../services/keyService";
import { validatorService } from "../../services/validatorService";
import { generatePrompt } from "../utils";
import { parseLLMReply as parseVote } from "../responseParser";

// Simple in-memory rate limiting
const rateLimits = {
  requestsPerMinute: 15,
  requestCounter: 0,
  lastResetTime: Date.now(),
};

// Error tracking
const errorTracking = {
  consecutiveErrors: 0,
  lastErrorTime: 0,
  backoffTime: 1000, // Initial backoff time (1 second)
};

/**
 * Grok-based validator implementation
 */
export class GrokValidator implements AIValidator {
  id: string;
  name: string;
  description?: string;
  provider: string;
  modelName: string;
  validatorType?: string;
  active: boolean;
  keyId?: string;

  constructor(options: {
    id?: string;
    name?: string;
    keyId?: string;
    modelName?: string;
    active?: boolean;
  }) {
    this.id = options.id || uuidv4();
    this.modelName = options.modelName || "grok-1";
    this.name = options.name || `${this.modelName.toUpperCase()} Validator`;
    this.provider = "Grok";
    this.description = `This validator leverages xAI's ${this.modelName} model for fact-checking, providing fast and contextually aware reasoning.`;
    this.validatorType = "Contextual Reasoning Engine";
    this.active = options.active !== undefined ? options.active : true;
    this.keyId = options.keyId;
  }

  /**
   * Check and update rate limits
   * @returns Whether we're within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset counter if a minute has passed
    if (now - rateLimits.lastResetTime > 60000) {
      rateLimits.requestCounter = 0;
      rateLimits.lastResetTime = now;
    }

    // Check if we're over the limit
    if (rateLimits.requestCounter >= rateLimits.requestsPerMinute) {
      return false;
    }

    // Increment counter
    rateLimits.requestCounter++;
    return true;
  }

  /**
   * Apply exponential backoff for errors
   */
  private shouldBackoff(): { shouldWait: boolean; waitTime: number } {
    const now = Date.now();

    // If we've had consecutive errors, calculate backoff
    if (errorTracking.consecutiveErrors > 0) {
      const waitTime = Math.min(
        errorTracking.backoffTime *
          Math.pow(2, errorTracking.consecutiveErrors - 1),
        30000
      );
      const timeElapsed = now - errorTracking.lastErrorTime;

      if (timeElapsed < waitTime) {
        return { shouldWait: true, waitTime: waitTime - timeElapsed };
      }
    }

    return { shouldWait: false, waitTime: 0 };
  }

  /**
   * Get an API key for this validator
   */
  private async getApiKey(): Promise<string | null> {
    // Check if we're in a server environment where process.env is available
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.GROQ_API_KEY
    ) {
      return process.env.GROQ_API_KEY;
    } else if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.GROK_API_KEY
    ) {
      return process.env.GROK_API_KEY;
    }


    // Fall back to key service only if env variable isn't available
    if (this.keyId) {
      const key = await keyService.getDecryptedKey(this.keyId);
      if (key) {
        return key;
      }
    }

    // Fall back to any active key for Grok
    const keyData = await keyService.getFirstActiveKeyForProvider("Grok");
    if (keyData) {
      this.keyId = keyData.id; // Update keyId for future use
      return keyData.key;
    } else {
      return null;
    }
  }

  /**
   * Validate a statement using Grok's API
   */
  async validate(request: ValidationRequest): Promise<AIValidationResponse> {
    const startTime = Date.now();

    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        return {
          vote: false,
          confidence: 0,
          rationale: "Rate limit exceeded for Grok API",
          error: "RATE_LIMIT_EXCEEDED",
        };
      }

      // Check backoff status
      const backoffStatus = this.shouldBackoff();
      if (backoffStatus.shouldWait) {
        return {
          vote: false,
          confidence: 0,
          rationale: `Service temporarily unavailable (${Math.round(backoffStatus.waitTime / 1000)}s backoff)`,
          error: "SERVICE_BACKOFF",
        };
      }

      // Get API key
      const apiKey = await this.getApiKey();

      // If we have no API key or we're in the browser, simulate response
      if (!apiKey || typeof window !== "undefined") {
        return this.simulateResponse(request.statement);
      }


      // Generate prompt using utility function
      const { systemMessage, userMessage } = generatePrompt(
        request.queryMode,
        request.statement,
        request.context
      );

      try {
        // Make the API call using the xAI API endpoint directly with patterns from successful Rust implementation
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
            "X-API-Version": "2023-11-22",
          },
          body: JSON.stringify({
            model: "grok-2-latest", // Updated to match the Rust code example
            messages: [
              {
                role: "system",
                content: systemMessage,
              },
              {
                role: "user",
                content: userMessage,
              },
            ],
            temperature: 0.3,
            max_tokens: 1024,
          }),
          signal: AbortSignal.timeout(30000), // Extended timeout (30 seconds instead of 15)
        });


        // Get the raw response
        const rawData = await response.text();

        // Check if response is not OK
        if (!response.ok) {
          console.error(`[Grok ${this.id}] API error with status ${response.status}`);
          let errorData;
          try {
            errorData = JSON.parse(rawData);
            console.error(`[Grok ${this.id}] Grok API error details:`, errorData);
          } catch {
            console.error(`[Grok ${this.id}] Could not parse error response as JSON`);
          }

          const errorMessage = `Grok API error: ${response.status} ${response.statusText}${errorData ? " - " + JSON.stringify(errorData) : ""}`;

          // Track consecutive errors for backoff
          errorTracking.consecutiveErrors++;
          errorTracking.lastErrorTime = Date.now();
          if (errorTracking.consecutiveErrors === 1) {
            errorTracking.backoffTime = 1000; // Reset backoff time on first error
          }

          throw new Error(errorMessage);
        }

        // Reset error tracking on success
        errorTracking.consecutiveErrors = 0;

        try {
          const data = JSON.parse(rawData);

          // Extract response text - assuming similar structure to OpenAI
          const reply = data.choices?.[0]?.message?.content || "";

          const endTime = Date.now();

          // Parse the response to determine validity and confidence
          const parsed = parseVote(reply);
          const { decision: vote, confidence = 0.8, rationale } = parsed;

          return {
            vote,
            confidence,
            rationale,
            latency: endTime - startTime,
          };
        } catch (parseError: unknown) {
          const errorMessage =
            parseError instanceof Error
              ? parseError.message
              : String(parseError);
          console.error(`[Grok ${this.id}] Failed to parse response:`, parseError);
          throw new Error(`Failed to parse Grok API response: ${errorMessage}`);
        }
      } catch (error) {
        const endTime = Date.now();
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Enhanced error logging
        console.error(`[Grok ${this.id}] Error calling Grok: ${errorMessage}`);

        // Check if this is the first error after success
        if (errorTracking.consecutiveErrors === 0) {
          errorTracking.consecutiveErrors = 1;
          errorTracking.lastErrorTime = Date.now();
        }

        return {
          vote: false,
          confidence: 0,
          rationale: `Error: ${errorMessage}`,
          error: errorMessage,
          latency: endTime - startTime,
        };
      }
    } catch (error) {
      const endTime = Date.now();
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Enhanced error logging
      console.error(`[Grok ${this.id}] Error calling Grok: ${errorMessage}`);

      // Check if this is the first error after success
      if (errorTracking.consecutiveErrors === 0) {
        errorTracking.consecutiveErrors = 1;
        errorTracking.lastErrorTime = Date.now();
      }

      return {
        vote: false,
        confidence: 0,
        rationale: `Error: ${errorMessage}`,
        error: errorMessage,
        latency: endTime - startTime,
      };
    }
  }

  private simulateResponse(text: string): AIValidationResponse {
    // Simulation logic for Grok
    const randomFactor = Math.random();
    const lengthFactor = Math.min(1, text.length / 200);
    const complexityFactor = text.split(" ").length / 20;

    // Grok tends to be more factual and less cautious in our simulation
    const vote =
      randomFactor > 0.3 + lengthFactor * 0.2 + complexityFactor * 0.1;
    const confidence = Math.floor(65 + randomFactor * 35) / 100;

    const rationale = vote
      ? `This statement appears to be factually accurate based on my knowledge. The information provided is consistent with established facts.`
      : `This statement contains inaccuracies or makes claims that cannot be verified with confidence based on available information.`;

    return {
      vote,
      confidence,
      rationale,
    };
  }

  /**
   * Create and save this validator in the database
   */
  static async create(options: {
    name?: string;
    keyId?: string;
    modelName?: string;
    active?: boolean;
  }): Promise<GrokValidator> {
    // Create the validator instance
    const validator = new GrokValidator(options);

    // Save to database
    await validatorService.addValidator(validator);

    return validator;
  }
}