import { v4 as uuidv4 } from "uuid";
import { AIValidator, AIValidationResponse, ValidationRequest } from "../types";
import { keyService } from "../../services/keyService";
import { validatorService } from "../../services/validatorService";

// Simple in-memory rate limiting
const rateLimits = {
  requestsPerMinute: 20,
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
 * OpenAI-based validator implementation with improved error handling and rate limiting
 */
export class OpenAIValidator implements AIValidator {
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
    this.modelName = options.modelName || "gpt-4o";
    this.name = options.name || `${this.modelName.toUpperCase()} Validator`;
    this.provider = "OpenAI";
    this.description = `This validator uses OpenAI's ${this.modelName} model, which excels at balanced decision-making based on multiple perspectives and ethical considerations.`;
    this.validatorType = "Multimodal Reasoning Engine";
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
        30000,
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
    // Use environment variable directly instead of key service
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
      console.log("Using OpenAI API key from environment variable");
      return envKey;
    }

    console.log("Environment variable not found, falling back to key service");

    // Fall back to key service only if env variable isn't available
    if (this.keyId) {
      const key = await keyService.getKeyValue(this.keyId);
      if (key) return key;
    }

    return keyService.getFirstActiveKeyForProvider("OpenAI");
  }

  /**
   * Validate a statement using OpenAI's API
   */
  async validate(request: ValidationRequest): Promise<AIValidationResponse> {
    const startTime = Date.now();

    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.log("Rate limit exceeded for OpenAI API");
        return {
          vote: false,
          confidence: 0,
          rationale: "Rate limit exceeded for OpenAI API",
          error: "RATE_LIMIT_EXCEEDED",
        };
      }

      // Check backoff status
      const backoffStatus = this.shouldBackoff();
      if (backoffStatus.shouldWait) {
        console.log(
          `Backing off OpenAI API for ${backoffStatus.waitTime}ms due to previous errors`,
        );
        return {
          vote: false,
          confidence: 0,
          rationale: `Service temporarily unavailable (${Math.round(backoffStatus.waitTime / 1000)}s backoff)`,
          error: "SERVICE_BACKOFF",
        };
      }

      // Get API key
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        throw new Error("No API key available for OpenAI");
      }

      // Make the API call
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.modelName,
            messages: [
              {
                role: "system",
                content:
                  "You are a fact-checking assistant. Your job is to determine whether statements are factually accurate. Respond with a decision of YES or NO, followed by your confidence level (0-100), and then a brief explanation of your reasoning.",
              },
              {
                role: "user",
                content: `Is this statement factually accurate? "${request.statement}"${request.context ? `\nContext: ${request.context}` : ""}`,
              },
            ],
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(15000), // 15-second timeout
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = `OpenAI API error: ${response.status} ${response.statusText}${errorData ? " - " + JSON.stringify(errorData) : ""}`;

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

      const data = await response.json();
      const reply = data.choices[0].message.content;
      const endTime = Date.now();

      // Parse the response to determine validity and confidence
      const { vote, confidence, rationale } = this.parseResponse(reply);

      return {
        vote,
        confidence,
        rationale,
        latency: endTime - startTime,
      };
    } catch (error) {
      const endTime = Date.now();
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error calling OpenAI: ${errorMessage}`);

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

  private parseResponse(response: string): {
    vote: boolean;
    confidence: number;
    rationale: string;
  } {
    const lowerResponse = response.toLowerCase().trim();

    // Detect vote (yes/no)
    const vote = lowerResponse.startsWith("yes");

    // Try to extract confidence
    let confidence = 70; // Default confidence
    const confidenceMatch =
      lowerResponse.match(/confidence[:\s]+(\d+)/i) ||
      lowerResponse.match(/(\d+)%/);

    if (confidenceMatch && confidenceMatch[1]) {
      const parsedConfidence = parseInt(confidenceMatch[1], 10);
      if (
        !isNaN(parsedConfidence) &&
        parsedConfidence >= 0 &&
        parsedConfidence <= 100
      ) {
        confidence = parsedConfidence;
      }
    }

    // Get rationale (everything after the yes/no and confidence)
    let rationale = response
      .replace(/^(yes|no)[^a-z]+(confidence[:\s]+\d+|\d+%)?/i, "")
      .trim();

    // If no rationale was extracted, use the whole response
    if (!rationale) {
      rationale = response;
    }

    return { vote, confidence: confidence / 100, rationale };
  }

  /**
   * Create and save this validator in the database
   */
  static async create(options: {
    name?: string;
    keyId?: string;
    modelName?: string;
    active?: boolean;
  }): Promise<OpenAIValidator> {
    // Create the validator instance
    const validator = new OpenAIValidator(options);

    // Save to database
    await validatorService.addValidator(validator);

    return validator;
  }
}
