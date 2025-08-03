import { v4 as uuidv4 } from "uuid";
import { createLogger } from '@/lib/logger';

const logger = createLogger('validators:gemini');
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIValidator, AIValidationResponse, ValidationRequest, AdaptiveValidationRequest } from "../types";
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
    this.modelName = options.modelName || "gemini-2.0-flash";
    this.name = options.name || `${this.modelName.toUpperCase()} Validator`;
    this.provider = "Google";
    this.description = `This validator uses Google's ${this.modelName} model, which provides efficient and reliable responses for general reasoning tasks.`;
    this.validatorType = "Multimodal Generative Reasoning";
    this.active = options.active !== undefined ? options.active : true;
    this.keyId = options.keyId;

    // Log validator creation
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
    if (envKey) {
      return envKey;
    }


    // Fall back to key service only if env variable isn't available
    if (this.keyId) {
      const key = await keyService.getDecryptedKey(this.keyId);
      if (key) {
        return key;
      }
    }

    const keyData = await keyService.getFirstActiveKeyForProvider("Google");
    if (keyData) {
      this.keyId = keyData.id;
      return keyData.key;
    }
    return null;
  }

  /**
   * Validate a statement using Google Gemini API
   */
  async validate(request: ValidationRequest | AdaptiveValidationRequest): Promise<AIValidationResponse> {
    const startTime = Date.now();

    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        return {
          vote: false,
          confidence: 0,
          rationale: "Rate limit exceeded for Gemini API",
          error: "RATE_LIMIT_EXCEEDED",
          latency: Date.now() - startTime,
        };
      }

      // Check backoff status
      const backoffStatus = this.shouldBackoff();
      if (backoffStatus.shouldWait) {
        return {
          vote: false,
          confidence: 0,
          rationale: `Service temporarily unavailable (${Math.round(
            backoffStatus.waitTime / 1000
          )}s backoff)`,
          error: "SERVICE_BACKOFF",
        };
      }

      // Get API key
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error("No Gemini API key found. Check GEMINI_API_KEY environment variable.");
        throw new Error("No API key available for Gemini. Please check GEMINI_API_KEY is set.");
      }
      
      // Validate API key format
      if (!apiKey.startsWith('AIza')) {
        logger.warn('Gemini API key may be invalid - should start with AIza');
      }

      // Initialize the Google Generative AI client
      const genAI = new GoogleGenerativeAI(apiKey);

      // Make sure we're using a valid model name, defaulting to gemini-2.0-flash if necessary
      let modelName = this.modelName;
      if (!modelName || modelName === "gemini") {
        modelName = "gemini-2.0-flash";
      }
      
      
      // Ensure we have a valid Gemini model - Updated for 2025
      const validModels = [
        "gemini-2.0-flash", 
        "gemini-2.5-flash", 
        "gemini-2.5-pro",
        "gemini-1.5-flash", // Legacy, may not work for new projects
        "gemini-1.5-pro",   // Legacy, may not work for new projects
        "gemini-pro"
      ];
      
      // Map old model names to new ones
      if (modelName === "gemini-1.5-flash") {
        modelName = "gemini-2.0-flash";
        logger.info(`Mapped gemini-1.5-flash to ${modelName}`);
      } else if (modelName === "gemini-1.5-pro") {
        modelName = "gemini-2.5-pro";
        logger.info(`Mapped gemini-1.5-pro to ${modelName}`);
      }
      
      if (!validModels.some(valid => modelName === valid)) {
        logger.warn(`Unknown Gemini model: ${modelName}, defaulting to gemini-2.0-flash`);
        modelName = "gemini-2.0-flash";
      }

      const model = genAI.getGenerativeModel({ model: modelName });

      // Determine prompts based on request type
      let prompt: string;
      
      if ('systemMessage' in request) {
        // Adaptive request
        prompt = `${request.systemMessage}\n\n${request.userMessage}`;
      } else {
        // Regular request
        const { systemMessage, userMessage } = generatePrompt(
          request.queryMode,
          request.statement,
          request.context
        );
        prompt = `${systemMessage}\n\n${userMessage}`;
      }

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


        const endTime = Date.now();

        // For adaptive requests, return raw response
        if ('systemMessage' in request) {
          return {
            vote: textResponse.toUpperCase().startsWith("YES"),
            confidence: 0.85,
            rationale: textResponse,
            latency: endTime - startTime,
          };
        }

        // Parse structured JSON reply for regular requests
        const parsed = parseVote(textResponse);
        const { decision: vote, confidence = 0.8, rationale } = parsed;
        return {
          vote,
          confidence,
          rationale,
          latency: endTime - startTime,
        };
      } catch (apiError: unknown) {
        logger.error("[GEMINI] API error:", apiError);

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
        
        // Check for 404 errors which usually mean model not found
        if (message.includes("404") || message.includes("Not Found")) {
          message = `Model ${modelName} not found. Try gemini-1.5-flash or gemini-1.5-pro`;
        }
        
        throw new Error(`Gemini API error: ${message}`);
      }
    } catch (error) {
      const endTime = Date.now();
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`[GEMINI] Error in validate method: ${errorMessage}`);

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
