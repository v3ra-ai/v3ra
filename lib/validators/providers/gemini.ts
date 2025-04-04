import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIValidator, AIValidationResponse, ValidationRequest } from '../types';
import { keyService } from '../../services/keyService';
import { validatorService } from '../../services/validatorService';

// Rate limiting
const rateLimits = {
  requestsPerMinute: 20,
  requestCounter: 0,
  lastResetTime: Date.now()
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
    this.modelName = options.modelName || 'gemini-1.5-flash';
    this.name = options.name || `${this.modelName.toUpperCase()} Validator`;
    this.provider = 'Google';
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
  private shouldBackoff(): { shouldWait: boolean, waitTime: number } {
    const now = Date.now();
    
    // If we've had consecutive errors, calculate backoff
    if (errorTracking.consecutiveErrors > 0) {
      const waitTime = Math.min(errorTracking.backoffTime * Math.pow(2, errorTracking.consecutiveErrors - 1), 30000);
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
    console.log("Checking for Gemini API key:", envKey ? "Found key in environment" : "No key in environment variable");
    if (envKey) {
      console.log("Using Gemini API key from environment variable");
      return envKey;
    }
    
    console.log("Environment variable not found, falling back to key service");
    
    // Fall back to key service only if env variable isn't available
    if (this.keyId) {
      console.log(`Looking for key with ID: ${this.keyId}`);
      const key = await keyService.getKeyValue(this.keyId);
      if (key) {
        console.log("Found key in key service by ID");
        return key;
      }
      console.log("No key found with the specified ID");
    }
    
    console.log("Attempting to get first active key for Google provider");
    const firstKey = await keyService.getFirstActiveKeyForProvider('Google');
    console.log(firstKey ? "Found active Google key" : "No active Google keys found");
    return firstKey;
  }

  /**
   * Validate a statement using Google Gemini API
   */
  async validate(request: ValidationRequest): Promise<AIValidationResponse> {
    const startTime = Date.now();
    console.log(`[GEMINI] Starting validation for: "${request.statement.substring(0, 50)}..."`);
    
    try {
      console.log(`[GEMINI] Checking rate limits`);
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.log("[GEMINI] Rate limit exceeded");
        return {
          vote: false,
          confidence: 0,
          rationale: "Rate limit exceeded for Gemini API",
          error: "RATE_LIMIT_EXCEEDED"
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
          rationale: `Service temporarily unavailable (${Math.round(backoffStatus.waitTime / 1000)}s backoff)`,
          error: "SERVICE_BACKOFF"
        };
      }
      
      console.log(`[GEMINI] Getting API key`);
      // Get API key
      const apiKey = await this.getApiKey();
      console.log(`[GEMINI] API key retrieval result: ${apiKey ? "Success" : "Failed"}`);
      if (!apiKey) {
        throw new Error("No API key available for Gemini");
      }
      
      // Initialize the Google Generative AI client
      console.log(`[GEMINI] Initializing GoogleGenerativeAI with model: ${this.modelName}`);
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Make sure we're using a valid model name, defaulting to gemini-1.5-flash if necessary
      let modelName = this.modelName;
      if (!modelName || modelName === 'gemini') {
        modelName = 'gemini-1.5-flash';
        console.log(`[GEMINI] Invalid model name detected, using ${modelName} instead`);
      }
      
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `You are a fact-checking assistant. Your job is to determine whether statements are factually accurate.
                      Respond with a decision of YES or NO, followed by your confidence level (0-100), and then a brief explanation of your reasoning.
                      
                      Is this statement factually accurate? "${request.statement}"${request.context ? `\nContext: ${request.context}` : ''}`;
      
      console.log(`[GEMINI] Sending request with prompt: ${prompt.substring(0, 100)}...`);
      
      try {
        // Using generateText method with text parameter (updated API format)
        const result = await model.generateContent({
          contents: [{ 
            role: "user",
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
          }
        });
        
        // Reset error tracking on success
        errorTracking.consecutiveErrors = 0;
        
        // Get the response text
        const response = result.response;
        if (!response) {
          throw new Error("Empty response from Gemini API");
        }
        
        const text = response.text();
        if (!text || text.trim() === '') {
          throw new Error("Empty text in Gemini API response");
        }
        
        console.log(`[GEMINI] Received response: ${text.substring(0, 100)}...`);
        
        const endTime = Date.now();
        
        // Parse the response
        const { vote, confidence, rationale } = this.parseResponse(text);
        console.log(`[GEMINI] Parsed response: vote=${vote}, confidence=${confidence}, rationale length=${rationale.length}`);
        
        return {
          vote,
          confidence,
          rationale,
          latency: endTime - startTime
        };
      } catch (apiError: any) {
        console.error("[GEMINI] API error:", apiError);
        
        // Track consecutive errors for backoff
        errorTracking.consecutiveErrors++;
        errorTracking.lastErrorTime = Date.now();
        if (errorTracking.consecutiveErrors === 1) {
          errorTracking.backoffTime = 1000; // Reset backoff time on first error
        }
        
        throw new Error(`Gemini API error: ${apiError.message || 'Unknown API error'}`);
      }
    } catch (error) {
      const endTime = Date.now();
      const errorMessage = error instanceof Error ? error.message : String(error);
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
        latency: endTime - startTime
      };
    }
  }

  /**
   * Parse the AI's response to extract vote, confidence, and rationale.
   */
  private parseResponse(response: string): { vote: boolean, confidence: number, rationale: string } {
    console.log(`[GEMINI] Parsing response: ${response.substring(0, 100)}...`);
    
    // Handle empty or undefined responses
    if (!response || response.trim() === '') {
      console.warn(`[GEMINI] Empty response received`);
      return {
        vote: false,
        confidence: 0,
        rationale: "Unable to process empty response from Gemini API"
      };
    }
    
    const lowerResponse = response.toLowerCase().trim();
    
    let vote = false;
    let confidence = 0;
    let rationale = response; // Default rationale to the full response

    // Look for YES/NO indicators with flexible pattern matching
    if (/^yes\b|^i believe this is accurate|^this statement is accurate|^this is accurate|^the statement is correct|^correct\b|^true\b/i.test(lowerResponse)) {
      vote = true;
    } else if (/^no\b|^i believe this is inaccurate|^this statement is inaccurate|^this is inaccurate|^the statement is incorrect|^incorrect\b|^false\b/i.test(lowerResponse)) {
      vote = false;
    } else {
      // If no clear indicator at the start, look for YES/NO keywords anywhere
      const yesMatches = lowerResponse.match(/\byes\b|\baccurate\b|\bcorrect\b|\btrue\b/g) || [];
      const noMatches = lowerResponse.match(/\bno\b|\binaccurate\b|\bincorrect\b|\bfalse\b/g) || [];
      
      // Determine vote based on which set of keywords appears more frequently
      vote = yesMatches.length > noMatches.length;
      
      // If still ambiguous, default to false
      if (yesMatches.length === noMatches.length) {
        console.warn("[GEMINI] Ambiguous response, defaulting to NO");
        vote = false;
      }
    }

    // Extract confidence with flexible pattern matching
    const confidencePatterns = [
      /confidence[:\s]*(\d{1,3})%?/i,                // "Confidence: 85%"
      /(\d{1,3})%\s*confidence/i,                    // "85% confidence"
      /confidence\s*(?:level|score)[:\s]*(\d{1,3})%?/i, // "Confidence level: 85%"
      /(\d{1,3})(?:\.\d+)?%/,                        // "85%" or "85.5%"
      /(\d{1,3})(?:\.\d+)?\s*(?:percent|%)/          // "85 percent"
    ];
    
    for (const pattern of confidencePatterns) {
      const match = lowerResponse.match(pattern);
      if (match && match[1]) {
        const potentialConfidence = parseFloat(match[1]);
        if (!isNaN(potentialConfidence) && potentialConfidence >= 0 && potentialConfidence <= 100) {
          confidence = potentialConfidence / 100; // Convert to 0-1 scale
          break;
        }
      }
    }

    // If no confidence was found but we have a clear YES, assign a default confidence
    if (confidence === 0 && vote === true) {
      confidence = 0.7; // Default moderate-high confidence for YES votes
    } else if (confidence === 0 && vote === false) {
      confidence = 0.6; // Default moderate confidence for NO votes
    }

    // Extract rationale with improved pattern matching
    const rationalePatterns = [
      /(?:yes|no)[,\s.]+(?:\d{1,3}%?)?[,\s.]+(.+)/i,  // After "YES/NO" and possibly confidence
      /(?:\d{1,3}%)[,\s.]+(.+)/i,                     // After percentage
      /(?:confidence[:\s]*\d{1,3}%?)[,\s.]+(.+)/i,    // After "Confidence: XX%"
      /(?:explanation|rationale|reasoning)[:\s]+(.+)/i // After explicit section headers
    ];
    
    let foundRationale = false;
    for (const pattern of rationalePatterns) {
      const match = response.match(pattern);
      if (match && match[1] && match[1].trim()) {
        rationale = match[1].trim();
        foundRationale = true;
        break;
      }
    }
    
    // If no structured rationale found, use fallback approaches
    if (!foundRationale) {
      // Look for text after a colon
      if (response.includes(':')) {
        const colonParts = response.split(':');
        if (colonParts.length > 1 && colonParts[1].trim()) {
          rationale = colonParts.slice(1).join(':').trim();
        }
      } else if (response.includes('\n')) {
        // Try to use text after the first line break
        const lines = response.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          rationale = lines.slice(1).join('\n').trim();
        }
      }
    }

    console.log(`[GEMINI] Parsed result: Vote=${vote}, Confidence=${confidence}, Rationale=${rationale.substring(0, 50)}...`);
    return { vote, confidence, rationale };
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
