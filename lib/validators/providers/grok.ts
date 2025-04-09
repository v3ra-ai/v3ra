import { v4 as uuidv4 } from "uuid";
import { AIValidator, AIValidationResponse, ValidationRequest } from "../types";
import { keyService } from "../../services/keyService";
import { validatorService } from "../../services/validatorService";

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
    // Check if we're in a server environment where process.env is available
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.GROQ_API_KEY
    ) {
      console.log(
        `[Grok ${this.id}] Using Groq API key from environment variable`,
      );
      return process.env.GROQ_API_KEY;
    } else if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.GROK_API_KEY
    ) {
      console.log(
        `[Grok ${this.id}] Using Grok API key from environment variable as fallback`,
      );
      return process.env.GROK_API_KEY;
    }

    console.log(
      `[Grok ${this.id}] Environment variable not found, falling back to key service`,
    );

    // Fall back to key service only if env variable isn't available
    if (this.keyId) {
      console.log(
        `[Grok ${this.id}] Attempting to retrieve key with ID: ${this.keyId}`,
      );
      const key = await keyService.getKeyValue(this.keyId);
      if (key) {
        console.log(
          `[Grok ${this.id}] Successfully retrieved key from key service`,
        );
        return key;
      }
      console.log(
        `[Grok ${this.id}] Failed to retrieve key with ID: ${this.keyId}`,
      );
    }

    // Fall back to any active key for Grok
    console.log(
      `[Grok ${this.id}] Attempting to get first active key for Grok`,
    );
    const key = await keyService.getFirstActiveKeyForProvider("Grok");
    if (key) {
      console.log(
        `[Grok ${this.id}] Successfully retrieved first active key for Grok`,
      );
    } else {
      console.log(`[Grok ${this.id}] No active key found for Grok`);
    }
    return key;
  }

  /**
   * Validate a statement using Grok's API
   */
  async validate(request: ValidationRequest): Promise<AIValidationResponse> {
    const startTime = Date.now();
    console.log(
      `[Grok ${this.id}] Starting validation for statement: "${request.statement.substring(0, 30)}..."`,
    );

    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.log(`[Grok ${this.id}] Rate limit exceeded for Grok API`);
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
        console.log(
          `[Grok ${this.id}] Backing off Grok API for ${backoffStatus.waitTime}ms due to previous errors`,
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

      // If we have no API key or we're in the browser, simulate response
      if (!apiKey || typeof window !== "undefined") {
        console.log(
          `[Grok ${this.id}] Simulating Grok response (no API key or browser environment)`,
        );
        return this.simulateResponse(request.statement);
      }

      console.log(
        `[Grok ${this.id}] Preparing to call Grok API with model: ${this.modelName}`,
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
                content:
                  "You are a fact-checking assistant. Your job is to determine whether statements are factually accurate. Respond with a decision of YES or NO, followed by your confidence level (0-100), and then a brief explanation of your reasoning.",
              },
              {
                role: "user",
                content: `Is this statement factually accurate? "${request.statement}"${request.context ? `\nContext: ${request.context}` : ""}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 1024,
          }),
          signal: AbortSignal.timeout(30000), // Extended timeout (30 seconds instead of 15)
        });

        console.log(
          `[Grok ${this.id}] Grok API call completed with status: ${response.status} ${response.statusText}`,
        );

        // Get the raw response
        const rawData = await response.text();
        console.log(`[Grok ${this.id}] Grok API raw response: ${rawData}`);

        // Check if response is not OK
        if (!response.ok) {
          console.error(
            `[Grok ${this.id}] API error with status ${response.status}`,
          );
          let errorData;
          try {
            errorData = JSON.parse(rawData);
            console.error(
              `[Grok ${this.id}] Grok API error details:`,
              errorData,
            );
          } catch {
            console.error(
              `[Grok ${this.id}] Could not parse error response as JSON`,
            );
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
          console.log(
            `[Grok ${this.id}] Grok API response structure:`,
            JSON.stringify(data, null, 2),
          );

          // Extract response text - assuming similar structure to OpenAI
          const reply = data.choices?.[0]?.message?.content || "";
          console.log(`[Grok ${this.id}] Extracted Grok reply: ${reply}`);

          const endTime = Date.now();

          // Parse the response to determine validity and confidence
          const { vote, confidence, rationale } = this.parseResponse(reply);
          console.log(
            `[Grok ${this.id}] Parsed Grok response: vote=${vote}, confidence=${confidence}, rationale length=${rationale.length}`,
          );

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
          console.error(
            `[Grok ${this.id}] Error parsing Grok JSON response: ${errorMessage}`,
          );
          throw new Error(`Failed to parse Grok API response: ${errorMessage}`);
        }
      } catch (error) {
        const endTime = Date.now();
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Enhanced error logging
        console.error(`[Grok ${this.id}] Error calling Grok: ${errorMessage}`);
        console.error(
          `[Grok ${this.id}] Error type: ${error instanceof Error ? error.name : "Unknown"}`,
        );
        console.error(
          `[Grok ${this.id}] Error cause: ${error instanceof Error && error.cause ? String(error.cause) : "Unknown"}`,
        );
        console.error(
          `[Grok ${this.id}] Error stack: ${error instanceof Error && error.stack ? error.stack : "No stack trace"}`,
        );

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
      console.error(
        `[Grok ${this.id}] Error type: ${error instanceof Error ? error.name : "Unknown"}`,
      );
      console.error(
        `[Grok ${this.id}] Error cause: ${error instanceof Error && error.cause ? String(error.cause) : "Unknown"}`,
      );
      console.error(
        `[Grok ${this.id}] Error stack: ${error instanceof Error && error.stack ? error.stack : "No stack trace"}`,
      );

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

    console.log(
      `[Grok ${this.id}] Grok vote: ${vote}, confidence: ${confidence / 100}, rationale length: ${rationale.length}`,
    );

    return { vote, confidence: confidence / 100, rationale };
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
