import { v4 as uuidv4 } from "uuid";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIValidator, AIValidationResponse, ValidationRequest } from "../types";
import { keyService } from "../../services/keyService";
import { validatorService } from "../../services/validatorService";
import { generatePrompt } from "../utils";
import { parseLLMReply as parseVote } from "../responseParser";

// Rate limiting
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
 * Google Gemini-based validator implementation
 */
export class GeminiValidator implements AIValidator {
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
    // Use a standard Gemini model that's widely available
    this.modelName = options.modelName || "gemini-1.5-flash";
    this.name = options.name || `${this.modelName.toUpperCase()} Validator`;
    this.provider = "Google";
    this.description = `This validator uses Google's ${this.modelName} model, which provides efficient and reliable responses for general reasoning tasks.`;
    this.validatorType = "Multimodal Generative Reasoning";
    this.active = options.active !== undefined ? options.active : true;
    this.keyId = options.keyId;

    // Log validator creation
    console.log(`Created Gemini validator: ${this.name} (${this.modelName})`);
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
    // Use environment variable directly instead of key service
    const envKey = process.env.GEMINI_API_KEY;
    console.log(
      "Checking for Gemini API key:",
      envKey ? "Found key in environment" : "No key in environment variable"
    );
    if (envKey) {
      console.log("Using Gemini API key from environment variable");
      return envKey;
    }

    console.log("Environment variable not found, falling back to key service");

    // Fall back to key service only if env variable isn't available
    if (this.keyId) {
      console.log(`Looking for key with ID: ${this.keyId}`);
      const key = await keyService.getDecryptedKey(this.keyId);
      if (key) {
        console.log("Found key in key service by ID");
        return key;
      }
      console.log("No key found with the specified ID");
    }

    console.log("Attempting to get first active key for Google provider");
    const keyData = await keyService.getFirstActiveKeyForProvider("Google");
    if (keyData) {
      this.keyId = keyData.id;
      console.log("Found active key for Google provider");
      return keyData.key;
    }
    console.log("No active Google keys found");
    return null;
  }

  /**
   * Validate a statement using Google Gemini API
   */
  async validate(request: ValidationRequest): Promise<AIValidationResponse> {
    const startTime = Date.now();
    console.log(
      `[GEMINI] Starting validation for: "${request.statement.substring(
        0,
        50
      )}..."`
    );

    try {
      console.log(`[GEMINI] Checking rate limits`);
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.log("[GEMINI] Rate limit exceeded");
        return {
          vote: false,
          confidence: 0,
          rationale: "Rate limit exceeded for Gemini API",
          error: "RATE_LIMIT_EXCEEDED",
        };
      }

      console.log(`[GEMINI] Checking backoff status`);
      // Check backoff status
      const backoffStatus = this.shouldBackoff();
      if (backoffStatus.shouldWait) {
        console.log(`[GEMINI] Backing off for ${backoffStatus.waitTime}ms`);
        return {
          vote: false,
          confidence: 0,
          rationale: `Service temporarily unavailable (${Math.round(
            backoffStatus.waitTime / 1000
          )}s backoff)`,
          error: "SERVICE_BACKOFF",
        };
      }

      console.log(`[GEMINI] Getting API key`);
      // Get API key
      const apiKey = await this.getApiKey();
      console.log(
        `[GEMINI] API key retrieval result: ${apiKey ? "Success" : "Failed"}`
      );
      if (!apiKey) {
        throw new Error("No API key available for Gemini");
      }

      // Initialize the Google Generative AI client
      console.log(
        `[GEMINI] Initializing GoogleGenerativeAI with model: ${this.modelName}`
      );
      const genAI = new GoogleGenerativeAI(apiKey);

      // Make sure we're using a valid model name, defaulting to gemini-1.5-flash if necessary
      let modelName = this.modelName;
      if (!modelName || modelName === "gemini") {
        modelName = "gemini-1.5-flash";
        console.log(
          `[GEMINI] Invalid model name detected, using ${modelName} instead`
        );
      }

      const model = genAI.getGenerativeModel({ model: modelName });

      // Generate prompt using utility function
      const { systemMessage, userMessage } = generatePrompt(
        request.queryMode,
        request.statement,
        request.context
      );
      const prompt = `${systemMessage}\n\n${userMessage}`; // Gemini combines system and user prompts

      console.log(
        `[GEMINI] Sending request with prompt: ${prompt.substring(0, 100)}...`
      );

      try {
        // Using generateText method with text parameter (updated API format)
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
          },
        });

        // Reset error tracking on success
        errorTracking.consecutiveErrors = 0;

        // Get the response text
        const response = result.response;
        if (!response) {
          throw new Error("Empty response from Gemini API");
        }

        const textResponse = response.text();
        if (!textResponse || textResponse.trim() === "") {
          throw new Error("Empty text in Gemini API response");
        }

        console.log(`[GEMINI] Received response: ${textResponse.substring(0, 100)}...`);

        const endTime = Date.now();

        // Parse structured JSON reply
        const parsed = parseVote(textResponse);
        const { decision: vote, confidence = 0.8, rationale } = parsed;

        console.log(
          `[GEMINI] Parsed result: Vote=${vote}, Confidence=${confidence}, Rationale=${rationale.substring(
            0,
            50
          )}...`
        );
        return {
          vote,
          confidence,
          rationale,
          latency: endTime - startTime,
        };
      } catch (apiError: unknown) {
        console.error("[GEMINI] API error:", apiError);

        // Track consecutive errors for backoff
        errorTracking.consecutiveErrors++;
        errorTracking.lastErrorTime = Date.now();
        if (errorTracking.consecutiveErrors === 1) {
          errorTracking.backoffTime = 1000; // Reset backoff time on first error
        }

        let message = "Unknown API error";
        if (
          typeof apiError === "object" &&
          apiError !== null &&
          "message" in apiError
        ) {
          message = String((apiError as { message: string }).message);
        }
        throw new Error(`Gemini API error: ${message}`);
      }
    } catch (error) {
      const endTime = Date.now();
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[GEMINI] Error in validate method: ${errorMessage}`);

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

  /**
   * Create and save this validator in the database
   */
  static async create(options: {
    name?: string;
    keyId?: string;
    modelName?: string;
    active?: boolean;
  }): Promise<GeminiValidator> {
    // Create the validator instance
    const validator = new GeminiValidator(options);

    // Save to database
    await validatorService.addValidator(validator);

    return validator;
  }
}
