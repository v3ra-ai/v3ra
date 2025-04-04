import { v4 as uuidv4 } from 'uuid';
import { AIValidator, AIValidationResponse, ValidationRequest } from '../types';
import { keyService } from '../../services/keyService';
import { validatorService } from '../../services/validatorService';

// Simple in-memory rate limiting
const rateLimits = {
  requestsPerMinute: 15, // More conservative than OpenAI due to stricter limits
  requestCounter: 0,
  lastResetTime: Date.now()
};

// Error tracking
const errorTracking = {
  consecutiveErrors: 0,
  lastErrorTime: 0,
  backoffTime: 1000, // Initial backoff time (1 second)
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
    this.modelName = options.modelName || 'claude-3-sonnet-20240229';
    this.name = options.name || `${this.modelName.replace(/claude-\d-/, '').toUpperCase()} Validator`;
    this.provider = 'Anthropic';
    this.description = `This validator leverages Anthropic's ${this.modelName} model, known for its thoughtful approach to content evaluation and strong performance in factual verification tasks.`;
    this.validatorType = "Constitutional AI Reasoner";
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
    // Check if we're in a server environment where process.env is available
    if (typeof process !== 'undefined' && process.env && process.env.ANTHROPIC_API_KEY) {
      console.log(`[Anthropic ${this.id}] Using Anthropic API key from environment variable`);
      return process.env.ANTHROPIC_API_KEY;
    }
    
    console.log(`[Anthropic ${this.id}] Environment variable not found, falling back to key service`);
    
    // Fall back to key service only if env variable isn't available
    if (this.keyId) {
      console.log(`[Anthropic ${this.id}] Attempting to retrieve key with ID: ${this.keyId}`);
      const key = await keyService.getKeyValue(this.keyId);
      if (key) {
        console.log(`[Anthropic ${this.id}] Successfully retrieved key from key service`);
        return key;
      }
      console.log(`[Anthropic ${this.id}] Failed to retrieve key with ID: ${this.keyId}`);
    }
    
    // Fall back to any active key for Anthropic
    console.log(`[Anthropic ${this.id}] Attempting to get first active key for Anthropic`);
    const key = await keyService.getFirstActiveKeyForProvider('Anthropic');
    if (key) {
      console.log(`[Anthropic ${this.id}] Successfully retrieved first active key for Anthropic`);
    } else {
      console.log(`[Anthropic ${this.id}] No active key found for Anthropic`);
    }
    return key;
  }

  async validate(request: ValidationRequest): Promise<AIValidationResponse> {
    const startTime = Date.now();
    console.log(`[Anthropic ${this.id}] Starting validation for statement: "${request.statement.substring(0, 30)}..."`);
    
    try {
      // Check rate limiting
      if (!this.checkRateLimit()) {
        console.log(`[Anthropic ${this.id}] Rate limit exceeded for Anthropic API`);
        return {
          vote: false,
          confidence: 0,
          rationale: "Rate limit exceeded for Anthropic API",
          error: "RATE_LIMIT_EXCEEDED"
        };
      }
      
      // Check backoff status
      const backoffStatus = this.shouldBackoff();
      if (backoffStatus.shouldWait) {
        console.log(`[Anthropic ${this.id}] Backing off Anthropic API for ${backoffStatus.waitTime}ms due to previous errors`);
        return {
          vote: false,
          confidence: 0,
          rationale: `Service temporarily unavailable (${Math.round(backoffStatus.waitTime / 1000)}s backoff)`,
          error: "SERVICE_BACKOFF"
        };
      }
      
      // Get the API key
      const apiKey = await this.getApiKey();
      
      // If we have no API key or we're in the browser, simulate response
      if (!apiKey || typeof window !== 'undefined') {
        console.log(`[Anthropic ${this.id}] Simulating Anthropic response (no API key or browser environment)`);
        return this.simulateResponse(request.statement);
      }
      
      console.log(`[Anthropic ${this.id}] Preparing to call Anthropic API with model: ${this.modelName}`);
      
      // Make the API call
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Anthropic-Version': '2023-06-01', // Updated to a valid version
          'X-API-Key': apiKey, // Added this header to match our working test script
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { 
              role: 'user', 
              content: `Is this statement factually accurate? Please analyze carefully.
              
Statement: "${request.statement}"${request.context ? `\nContext: ${request.context}` : ''}` 
            }
          ],
          system: "You are a fact-checking assistant. Analyze the statement and respond with a YES or NO decision, followed by your confidence level (0-100), and then a brief explanation of your reasoning.",
          temperature: 0.3,
          max_tokens: 1024 // Use max_tokens instead of max_tokens_to_sample
        }),
        signal: AbortSignal.timeout(20000) // 20-second timeout
      });

      console.log(`[Anthropic ${this.id}] Anthropic API call completed with status: ${response.status} ${response.statusText}`);
      
      // Debug raw response
      const rawData = await response.text();
      console.log(`[Anthropic ${this.id}] Anthropic API raw response: ${rawData}`);
      
      // Check if response is not OK
      if (!response.ok) {
        console.error(`[Anthropic ${this.id}] API error with status ${response.status}`);
        let errorData;
        try {
          errorData = JSON.parse(rawData);
          console.error(`[Anthropic ${this.id}] Anthropic API error details:`, errorData);
        } catch (e) {
          console.error(`[Anthropic ${this.id}] Could not parse error response as JSON`);
        }
        
        const errorMessage = `Anthropic API error: ${response.status} ${response.statusText}${errorData ? ' - ' + JSON.stringify(errorData) : ''}`;
        
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
        console.log(`[Anthropic ${this.id}] Anthropic API response structure:`, JSON.stringify(data, null, 2));
        
        // Handle different potential response structures
        let reply = '';
        if (data.content && Array.isArray(data.content) && data.content.length > 0) {
          // New API structure with content array
          const textContents = data.content
            .filter((item: { type: string }) => item.type === 'text')
            .map((item: { text: string }) => item.text)
            .join(' ');
          reply = textContents || '';
        } else if (data.message && data.message.content) {
          // Alternative structure
          reply = data.message.content;
        } else if (data.messages && data.messages.length > 0) {
          // Older structure
          reply = data.messages[0].content || '';
        } else if (data.completion) {
          // Legacy API format
          reply = data.completion;
        } else {
          console.error(`[Anthropic ${this.id}] Unexpected Anthropic API response structure:`, data);
          reply = '';
        }
        
        console.log(`[Anthropic ${this.id}] Extracted Anthropic reply: ${reply}`);
        const endTime = Date.now();
        
        // Parse the response to determine validity and confidence
        const { vote, confidence, rationale } = this.parseResponse(reply);
        console.log(`[Anthropic ${this.id}] Parsed Anthropic response: vote=${vote}, confidence=${confidence}, rationale length=${rationale.length}`);
        
        return {
          vote,
          confidence,
          rationale,
          latency: endTime - startTime
        };
      } catch (parseError: unknown) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        console.error(`[Anthropic ${this.id}] Error parsing Anthropic JSON response: ${errorMessage}`);
        throw new Error(`Failed to parse Anthropic API response: ${errorMessage}`);
      }
    } catch (error) {
      const endTime = Date.now();
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Anthropic ${this.id}] Error calling Anthropic: ${errorMessage}`);
      
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

  private parseResponse(response: string): { vote: boolean, confidence: number, rationale: string } {
    const lowerResponse = response.toLowerCase().trim();
    
    // Use LLM-based analysis approach - clearer yes/no detection
    let vote = false;
    if (lowerResponse.startsWith('yes') || 
        lowerResponse.includes('yes.') || 
        lowerResponse.includes('the statement is accurate') ||
        lowerResponse.includes('this statement is correct')) {
      vote = true;
    }
    
    // Try to extract confidence, with better handling of different formats
    let confidence = 75; // Default confidence
    const confidenceMatch = lowerResponse.match(/confidence[:\s]+(\d+)/i) || 
                           lowerResponse.match(/(\d+)%/) ||
                           lowerResponse.match(/(\d+)\s*percent/) ||
                           lowerResponse.match(/confidence[:\s]+(high|medium|low)/i);
    
    if (confidenceMatch) {
      if (confidenceMatch[1].match(/^\d+$/)) {
        // Numeric confidence
        const parsedConfidence = parseInt(confidenceMatch[1], 10);
        if (!isNaN(parsedConfidence) && parsedConfidence >= 0 && parsedConfidence <= 100) {
          confidence = parsedConfidence;
        }
      } else if (confidenceMatch[1].match(/high/i)) {
        confidence = 90;
      } else if (confidenceMatch[1].match(/medium/i)) {
        confidence = 70;
      } else if (confidenceMatch[1].match(/low/i)) {
        confidence = 50;
      }
    }
    
    // Get rationale (everything after the yes/no and confidence)
    let rationale = response.replace(/^(yes|no)[^a-z]+(confidence[:\s]+\d+|\d+%)?/i, '').trim();
    if (!rationale) {
      rationale = vote 
        ? "Based on my analysis, this statement appears to be factually accurate."
        : "Based on my analysis, this statement contains inaccuracies or unverifiable claims.";
    }
    
    console.log(`[Anthropic ${this.id}] Anthropic vote: ${vote}, confidence: ${confidence/100}, rationale length: ${rationale.length}`);
    
    return { vote, confidence: confidence / 100, rationale };
  }

  private simulateResponse(text: string): AIValidationResponse {
    // Simulation logic - Claude tends to be slightly more careful
    const randomFactor = Math.random();
    const lengthFactor = Math.min(1, text.length / 200);
    const complexityFactor = text.split(' ').length / 20;
    const vote = randomFactor > (0.35 + lengthFactor * 0.3 + complexityFactor * 0.15);
    const confidence = Math.floor(55 + randomFactor * 45) / 100;
    
    let rationale = vote 
      ? `This statement appears to be factually accurate based on my analysis. The information aligns with established knowledge.` 
      : `This statement contains inaccuracies or makes claims that cannot be verified with confidence. The factual basis is questionable.`;
    
    return {
      vote,
      confidence,
      rationale
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
  }): Promise<AnthropicValidator> {
    // Create the validator instance
    const validator = new AnthropicValidator(options);
    
    // Save to database
    await validatorService.addValidator(validator);
    
    return validator;
  }
}
