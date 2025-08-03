import { AIValidator, ValidationRequest, AIValidationResponse } from "../types";
import { createLogger } from '@/lib/logger';

const logger = createLogger('validators:huggingface');
import type { QueryMode } from "@/lib/types";
import { generatePrompt } from "../utils";
import { parseLLMReply as parseVote } from "../responseParser";

export class HuggingFaceValidator implements AIValidator {
  id: string;
  name: string;
  provider = "HuggingFace"; // Ensure this matches the string used in the database and registry
  modelName: string;
  active: boolean;
  private apiKey: string;
  queryMode: QueryMode; // Keep as QueryMode for type safety

  constructor(opts: {
    id: string;
    name: string;
    modelName: string;
    active: boolean;
    keyId?: string;
    queryMode?: QueryMode;
  }) {
    this.id = opts.id;
    this.name = opts.name;
    this.modelName = opts.modelName;
    this.active = opts.active;
    this.queryMode = opts.queryMode || "fact-check"; // Default to factCheck

    const envApiKey = process.env.HUGGING_FACE_API_KEY;
    if (!envApiKey) {
      logger.error(
        "CRITICAL: HUGGING_FACE_API_KEY is not set in environment variables."
      );
      throw new Error(
        "HUGGING_FACE_API_KEY is not set in environment variables."
      );
    }
    this.apiKey = envApiKey;
  }

  async validate(req: ValidationRequest): Promise<AIValidationResponse> {
    if (!this.apiKey) {
      logger.error(
        "HuggingFaceValidator: API key is missing. Cannot validate."
      );
      return {
        vote: false,
        confidence: 0,
        rationale: "Hugging Face API key is not configured for this validator.",
        providerName: this.provider,
        modelName: this.modelName,
      };
    }

    try {
      const startTime = Date.now();

      // Generate prompt using utility function
      const promptResult = generatePrompt(
        req.queryMode,
        req.statement,
        req.context
      );
      let { systemMessage } = promptResult;
      const { userMessage } = promptResult;
      
      // Add clear instructions for clean JSON responses
      systemMessage = systemMessage + "\n\nIMPORTANT: Respond with ONLY a valid JSON object in the format {\"answer\": \"Yes\" or \"No\", \"confidence\": number from 0-100, \"rationale\": \"your reasoning\"}. Do not include markdown code blocks, prefixes, or any additional text outside the JSON object.";

      // Structure the messages in a chat format
      // const messages = [
      //   { role: "system", content: systemMessage },
      //   { role: "user", content: userMessage }
      // ];

      // For now, use legacy endpoint for all models as router endpoint returns 404
      // The HuggingFace API is in transition and the router endpoint isn't working for our models
      const endpoint = `https://api-inference.huggingface.co/models/${this.modelName}`;
      
      // Combine system and user messages for the legacy endpoint
      const combinedPrompt = `${systemMessage}\n\n${userMessage}`;
      
      const payload = {
        inputs: combinedPrompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.3,
          return_full_text: false,
          // Add additional parameters that might help with response formatting
          top_p: 0.95,
          do_sample: true
        }
      };

      // Implement retry logic for model loading
      const maxRetries = 3;
      let lastError: { status: number; statusText: string; body: string } | undefined;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (response.status === 503 && attempt < maxRetries - 1) {
            // Model is loading, wait and retry
            await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
            continue;
          }

          if (!response.ok) {
            const errorBody = await response.text();
            lastError = {
              status: response.status,
              statusText: response.statusText,
              body: errorBody
            };
            
            // Don't retry on 4xx errors
            if (response.status >= 400 && response.status < 500) {
              break;
            }
            
            if (attempt < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
          }

          // Success - process the response
          const data = await response.json();
          const latency = Date.now() - startTime;

          // Extract the generated text from legacy endpoint response
          let rawContent = "";
          
          // Legacy response format returns either object with generated_text or array
          if (data && data.generated_text) {
            rawContent = data.generated_text;
          } else if (data && Array.isArray(data) && data[0] && data[0].generated_text) {
            rawContent = data[0].generated_text;
          }

          
          // Clean up the response - remove any markdown code blocks
          rawContent = rawContent.replace(/```json|```/g, '').trim();
          
          // Ensure we have a complete JSON object by adding the closing brace if needed
          if (rawContent.includes('{') && !rawContent.endsWith('}')) {
            rawContent = rawContent + '}';
          }
          
          // If it looks like JSON, try to parse it and extract just the rationale
          if (rawContent.startsWith('{') && (rawContent.includes('"rationale"') || rawContent.includes('"explanation"'))) {
            try {
              const jsonData = JSON.parse(rawContent);
              // Keep the full JSON for the parser, but clean up the rationale for display
              const cleanRationale = jsonData.rationale || jsonData.explanation || '';
              
              // If the rationale itself still contains JSON, extract just the text
              if (typeof cleanRationale === 'string' && cleanRationale.includes('{') && cleanRationale.includes('"')) {
                try {
                  // Try to parse any JSON in the rationale
                  const match = cleanRationale.match(/\{[\s\S]*\}/);
                  if (match) {
                    const embeddedJson = JSON.parse(match[0]);
                    // Use the embedded rationale if it exists
                    if (embeddedJson.rationale || embeddedJson.explanation) {
                      jsonData.rationale = embeddedJson.rationale || embeddedJson.explanation;
                    }
                  }
                } catch {
                  // If parsing embedded JSON fails, keep the original rationale
                }
              }
              
              // Reconstruct the JSON with the cleaned rationale
              rawContent = JSON.stringify(jsonData);
            } catch (e) {
              logger.error(`[HuggingFace - ${this.modelName}] Error parsing JSON:`, e);
              // If JSON parsing fails, continue with the raw content
            }
          }
          
          // If the content doesn't look like JSON at all, wrap it in our expected format
          if (!rawContent.startsWith('{') && !rawContent.trim().startsWith('{')) {
            rawContent = `{"answer":"No","confidence":0,"rationale":"${rawContent.replace(/"/g, '\\"')}"}`;  
          }
          
          // Send to response parser
          const { decision: vote, confidence = 0.8, rationale } = parseVote(rawContent);

          // Process the vote - always use fact-check mode logic
          const finalVote = vote;

          return {
            vote: finalVote,
            confidence,
            rationale,
            providerName: this.provider,
            modelName: this.modelName,
            latency: latency,
          };
        } catch (error) {
          lastError = { 
            status: 500, 
            statusText: 'Network Error', 
            body: error instanceof Error ? error.message : 'Unknown network error' 
          };
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }

      // All retries failed
      logger.error(
        `Hugging Face API error after ${maxRetries} attempts:`,
        lastError?.status || 'Unknown',
        lastError?.statusText || '',
        lastError?.body || lastError
      );
      return {
        vote: false,
        confidence: 0,
        rationale: `Hugging Face API request failed after ${maxRetries} attempts: ${lastError?.status || 'Unknown'} ${lastError?.statusText || ''}. Details: ${lastError?.body || lastError}`,
        providerName: this.provider,
        modelName: this.modelName,
      };

      // This section was moved into the retry loop above
    } catch (error) {
      logger.error(`[HuggingFace - ${this.modelName}] Validation error:`, error);
      return {
        vote: false,
        confidence: 0,
        rationale: `Validation error: ${error}`,
        providerName: this.provider,
        modelName: this.modelName,
      };
    }
  }
}
