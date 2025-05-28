import { AIValidator, ValidationRequest, AIValidationResponse } from "../types";
import type { QueryMode } from "@/lib/types";
import { generatePrompt } from "../utils";
import { parseLLMReply as parseVote } from "../responseParser";
import { getAdapter } from "../modeAdapters";

export class OpenRouterValidator implements AIValidator {
  id: string;
  name: string;
  provider = "OpenRouter"; // Ensure this matches the string used in the database and registry
  modelName: string;
  active: boolean;
  private apiKey: string;
  queryMode: QueryMode; // Keep as QueryMode for type safety

  constructor(opts: {
    id: string;
    name: string;
    modelName: string;
    active: boolean;
    queryMode?: QueryMode;
  }) {
    this.id = opts.id;
    this.name = opts.name;
    this.modelName = opts.modelName;
    this.active = opts.active;
    this.queryMode = opts.queryMode || "fact-check"; // Default to factCheck

    const envApiKey = process.env.OPENROUTER_API_KEY;
    if (!envApiKey) {
      console.error(
        "CRITICAL: OPENROUTER_API_KEY is not set in environment variables."
      );
      throw new Error(
        "OPENROUTER_API_KEY is not set in environment variables."
      );
    }
    this.apiKey = envApiKey;
  }

  async validate(req: ValidationRequest): Promise<AIValidationResponse> {
    if (!this.apiKey) {
      // This case should ideally be prevented by the constructor check,
      // but as a safeguard:
      console.error(
        "OpenRouterValidator: API key is missing. Cannot validate."
      );
      return {
        vote: false,
        confidence: 0,
        rationale: "OpenRouter API key is not configured for this validator.",
        providerName: this.provider,
        modelName: this.modelName,
      };
    }

    console.log(
      `OpenRouterValidator validating statement: "${req.statement}" with model ${this.modelName} in mode ${req.queryMode || "fact-check"}`
    );

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

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            // Optional: Add other headers OpenRouter might recommend
            // "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL, // Your site URL
            // "X-Title": process.env.NEXT_PUBLIC_APP_NAME, // Your app name
          },
          body: JSON.stringify({
            model: this.modelName, // e.g., "openai/gpt-3.5-turbo"
            messages: [
              // Basic system prompt for validation, can be enhanced
              { role: "system", content: systemMessage },
              { role: "user", content: userMessage },
            ],
            // temperature: 0.3, // Example: make it less random
            // max_tokens: 50,   // Example: limit response length for validation
            temperature: 0.3,
            max_tokens: 1000,
            stop: ["}"],  // Stop at closing brace to ensure complete JSON
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `OpenRouter API error: ${response.status} ${response.statusText}`,
          errorBody
        );
        return {
          vote: false,
          confidence: 0,
          rationale: `OpenRouter API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`,
          providerName: this.provider,
          modelName: this.modelName,
        };
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      let vote: boolean;
      let confidence: number;
      let rationale: string;

      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        let rawContent = data.choices[0].message.content;
        console.log(`[OpenRouter - ${this.modelName}] Raw response content:`, rawContent);
        
        // Clean up the response - remove any markdown code blocks
        rawContent = rawContent.replace(/```json|```/g, '').trim();
        
        // Ensure we have a complete JSON object by adding the closing brace if needed
        // (since we used the stop parameter at "}", we might need to add it back)
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
            console.error(`[OpenRouter - ${this.modelName}] Error parsing JSON:`, e);
            // If JSON parsing fails, continue with the raw content
          }
        }
        
        // If the content doesn't look like JSON at all, wrap it in our expected format
        if (!rawContent.startsWith('{')) {
          rawContent = `{"answer":"No","confidence":0,"rationale":"${rawContent.replace(/"/g, '\\"')}"}`;  
        }
        
        const content = rawContent.trim();
        console.log(`[OpenRouter - ${this.modelName}] Processed content:`, content);
        const parsed = parseVote(content);
        console.log(`[OpenRouter - ${this.modelName}] Parsed reply object:`, parsed);
        const { vote: v, confidence: c, rationale: r } = getAdapter(req.queryMode).interpret(parsed);
        vote = v;
        confidence = c;
        rationale = r;
      } else {
        vote = false;
        confidence = 0;
        rationale = "Empty response from model.";
      }

      return {
        vote,
        confidence,
        rationale,
        providerName: this.provider,
        modelName: this.modelName,
        latency,
      };
    } catch (error) {
      console.error("Error in OpenRouterValidator validate method:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown validation error";
      return {
        vote: false,
        confidence: 0.0,
        rationale: `Validation failed due to an unexpected error: ${errorMessage}`,
        providerName: this.provider,
        modelName: this.modelName,
        latency: 0,
      };
    }
  }
}
