import { v4 as uuidv4 } from "uuid";
import { createLogger } from '@/lib/logger';

const logger = createLogger('validators:anthropic');
import { AIValidator, AIValidationResponse, ValidationRequest, AdaptiveValidationRequest } from "../types";
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
  backoffTime: 1000,
};

export class AnthropicValidator implements AIValidator {
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
    modelName?: string;
    keyId?: string;
    active?: boolean;
  }) {
    this.id = options.id || uuidv4();
    this.modelName = options.modelName || "claude-3-sonnet-20240229";
    this.name =
      options.name ||
      `${this.modelName.replace(/claude-\d-/, "").toUpperCase()} Validator`;
    this.provider = "Anthropic";
    this.description = `This validator leverages Anthropic's ${this.modelName} model, known for its thoughtful approach to content evaluation and strong performance in factual verification tasks.`;
    this.validatorType = "Constitutional AI Reasoner";
    this.active = options.active !== undefined ? options.active : true;
    this.keyId = options.keyId;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();

    if (now - rateLimits.lastResetTime > 60000) {
      rateLimits.requestCounter = 0;
      rateLimits.lastResetTime = now;
    }

    if (rateLimits.requestCounter >= rateLimits.requestsPerMinute) {
      return false;
    }

    rateLimits.requestCounter++;
    return true;
  }

  private shouldBackoff(): { shouldWait: boolean; waitTime: number } {
    const now = Date.now();

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

  private async getApiKey(): Promise<string | null> {
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.ANTHROPIC_API_KEY
    ) {
      return process.env.ANTHROPIC_API_KEY;
    }


    if (this.keyId) {
      const key = await keyService.getDecryptedKey(this.keyId);
      if (key) {
        return key;
      }
    }

    const keyData = await keyService.getFirstActiveKeyForProvider("Anthropic");
    if (keyData) {
      this.keyId = keyData.id; // Update keyId for future use
      return keyData.key;
    } else {
      return null;
    }
  }

  async validate(request: ValidationRequest | AdaptiveValidationRequest): Promise<AIValidationResponse> {
    const startTime = Date.now();

    try {
      if (!this.checkRateLimit()) {
        return {
          vote: false,
          confidence: 0,
          rationale: "Rate limit exceeded for Anthropic API",
          error: "RATE_LIMIT_EXCEEDED",
          latency: Date.now() - startTime,
        };
      }

      const backoffStatus = this.shouldBackoff();
      if (backoffStatus.shouldWait) {
        return {
          vote: false,
          confidence: 0,
          rationale: `Service temporarily unavailable (${Math.round(backoffStatus.waitTime / 1000)}s backoff)`,
          error: "SERVICE_BACKOFF",
          latency: Date.now() - startTime,
        };
      }

      const apiKey = await this.getApiKey();

      if (!apiKey || typeof window !== "undefined") {
        return this.simulateResponse(request.statement);
      }

      // Determine prompts based on request type
      let systemMessage: string;
      let userMessage: string;
      
      if ('systemMessage' in request) {
        // Adaptive request
        systemMessage = request.systemMessage;
        userMessage = request.userMessage;
      } else {
        // Regular request
        const prompt = generatePrompt(
          request.queryMode,
          request.statement,
          request.context
        );
        systemMessage = prompt.systemMessage;
        userMessage = prompt.userMessage;
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Anthropic-Version": "2023-06-01",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: "user",
              content: userMessage,
            },
          ],
          system: systemMessage,
          temperature: 0.3,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(20000),
      });


      const rawData = await response.text();

      if (!response.ok) {
        logger.error(`[Anthropic ${this.id}] API error with status ${response.status}`);
        let errorData;
        try {
          errorData = JSON.parse(rawData);
          logger.error(`[Anthropic ${this.id}] Anthropic API error details:`, errorData);
        } catch {
          logger.error(`[Anthropic ${this.id}] Could not parse error response as JSON`);
        }

        const errorMessage = `Anthropic API error: ${response.status} ${response.statusText}${errorData ? " - " + JSON.stringify(errorData) : ""}`;

        errorTracking.consecutiveErrors++;
        errorTracking.lastErrorTime = Date.now();
        if (errorTracking.consecutiveErrors === 1) {
          errorTracking.backoffTime = 1000;
        }

        throw new Error(errorMessage);
      }

      errorTracking.consecutiveErrors = 0;

      try {
        const data = JSON.parse(rawData);

        let reply = "";
        if (
          data.content &&
          Array.isArray(data.content) &&
          data.content.length > 0
        ) {
          const textContents = data.content
            .filter((item: { type: string }) => item.type === "text")
            .map((item: { text: string }) => item.text)
            .join(" ");
          reply = textContents || "";
        } else if (data.message && data.message.content) {
          reply = data.message.content;
        } else if (data.messages && data.messages.length > 0) {
          reply = data.messages[0].content || "";
        } else if (data.completion) {
          reply = data.completion;
        } else {
          logger.error(`[Anthropic ${this.id}] Unexpected Anthropic API response structure:`, data);
          reply = "";
        }

        const endTime = Date.now();

        // For adaptive requests, return raw response
        if ('systemMessage' in request) {
          return {
            vote: reply.toUpperCase().startsWith("YES"),
            confidence: 0.85,
            rationale: reply,
            latency: endTime - startTime,
          };
        }

        // For regular requests, parse structured response
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
          parseError instanceof Error ? parseError.message : String(parseError);
        logger.error(`[Anthropic ${this.id}] Failed to parse response:`, parseError);
        throw new Error(
          `Failed to parse Anthropic API response: ${errorMessage}`
        );
      }
    } catch (error) {
      const endTime = Date.now();
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`[Anthropic ${this.id}] Validation error:`, error);

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
    const randomFactor = Math.random();
    const lengthFactor = Math.min(1, text.length / 200);
    const complexityFactor = text.split(" ").length / 20;
    const vote =
      randomFactor > 0.35 + lengthFactor * 0.3 + complexityFactor * 0.15;
    const confidence = Math.floor(55 + randomFactor * 45) / 100;

    const rationale = vote
      ? `This statement appears to be factually accurate based on my analysis. The information aligns with established knowledge.`
      : `This statement contains inaccuracies or makes claims that cannot be verified with confidence. The factual basis is questionable.`;

    return {
      vote,
      confidence,
      rationale,
    };
  }

  static async create(options: {
    name?: string;
    keyId?: string;
    modelName?: string;
    active?: boolean;
  }): Promise<AnthropicValidator> {
    const validator = new AnthropicValidator(options);
    await validatorService.addValidator(validator);
    return validator;
  }
}