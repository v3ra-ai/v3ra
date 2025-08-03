import { v4 as uuidv4 } from "uuid";
import { AIValidator, AIValidationResponse, ValidationRequest, AdaptiveValidationRequest } from "../types";
import { keyService } from "../../services/keyService";
import { generatePrompt } from "../utils";
import { parseLLMReply as parseVote } from "../responseParser";
import { createLogger } from "@/lib/logger";

const logger = createLogger('openai-validator');

// Simple in-memory rate limiting
const rateLimits = {
  requestsPerMinute: 20,
  window: 60 * 1000, // 1 minute in milliseconds
};

const requestLog: { [key: string]: number[] } = {};

function checkRateLimit(modelName: string): boolean {
  const now = Date.now();
  const key = `openai-${modelName}`;
  
  if (!requestLog[key]) {
    requestLog[key] = [];
  }
  
  // Remove timestamps older than the window
  requestLog[key] = requestLog[key].filter(timestamp => now - timestamp < rateLimits.window);
  
  if (requestLog[key].length >= rateLimits.requestsPerMinute) {
    return false;
  }
  
  requestLog[key].push(now);
  return true;
}

export class OpenAIValidator implements AIValidator {
  id: string;
  name: string;
  provider = "OpenAI";
  modelName: string;
  active: boolean;
  keyId?: string;

  constructor(opts: {
    id?: string;
    name: string;
    modelName: string;
    active?: boolean;
    keyId?: string;
  }) {
    this.id = opts.id || uuidv4();
    this.name = opts.name;
    this.modelName = opts.modelName;
    this.active = opts.active ?? true;
    this.keyId = opts.keyId;
  }

  private getApiKey = async (): Promise<string | null> => {
    // First try environment variable
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
      return envKey;
    }

    // Then try key service if keyId is provided
    if (this.keyId) {
      const key = await keyService.getDecryptedKey(this.keyId);
      if (key) return key;
    }

    // Finally try to get any OpenAI key from key service
    const keyData = await keyService.getFirstActiveKeyForProvider("OpenAI");
    if (keyData) {
      this.keyId = keyData.id;
      return keyData.key;
    }

    logger.error('OpenAI API key not found');
    return null;
  };

  async validate(req: ValidationRequest | AdaptiveValidationRequest): Promise<AIValidationResponse> {
    try {
      // Check rate limit
      if (!checkRateLimit(this.modelName)) {
        return {
          vote: false,
          confidence: 0,
          rationale: "Rate limit exceeded. Please try again later.",
          providerName: this.provider,
          modelName: this.modelName,
        };
      }

      const apiKey = await this.getApiKey();
      if (!apiKey) {
        return {
          vote: false,
          confidence: 0,
          rationale: "No API key configured for OpenAI",
          providerName: this.provider,
          modelName: this.modelName,
        };
      }

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

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(`OpenAI API error: ${response.status}`, errorData);
        
        return {
          vote: false,
          confidence: 0,
          rationale: `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`,
          providerName: this.provider,
          modelName: this.modelName,
          latency,
        };
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        return {
          vote: false,
          confidence: 0,
          rationale: "No response from OpenAI model",
          providerName: this.provider,
          modelName: this.modelName,
          latency,
        };
      }

      const content = data.choices[0].message.content;
      
      // For adaptive requests, return raw response
      if ('systemMessage' in req) {
        const vote = content.toUpperCase().startsWith("YES");
        return {
          vote,
          confidence: vote ? 0.85 : 0.75,
          rationale: content,
          providerName: this.provider,
          modelName: this.modelName,
          latency,
        };
      }
      
      // For regular requests, parse the vote
      const parsed = parseVote(content);
      
      return {
        vote: parsed.decision,
        confidence: parsed.confidence || 0.8,
        rationale: parsed.rationale,
        providerName: this.provider,
        modelName: this.modelName,
        latency,
      };
    } catch (error) {
      logger.error("OpenAIValidator error:", error);
      return {
        vote: false,
        confidence: 0,
        rationale: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        providerName: this.provider,
        modelName: this.modelName,
      };
    }
  }
}