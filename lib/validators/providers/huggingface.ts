import { AIValidator, ValidationRequest, AIValidationResponse } from "../types";
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
      console.error(
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
      console.error(
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

    console.log(
      `HuggingFaceValidator validating statement: "${req.statement}" with model ${this.modelName} in mode ${req.queryMode || "fact-check"}`
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

      // Structure the messages in a chat format
      const messages = [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage }
      ];

      // Prepare the request payload
      // HF inference API format depends on model architecture, here we use the chat format
      const payload = {
        inputs: {
          messages: messages
        },
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.3,
          return_full_text: false
        }
      };

      // Using the model ID in the URL
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${this.modelName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `Hugging Face API error: ${response.status} ${response.statusText}`,
          errorBody
        );
        return {
          vote: false,
          confidence: 0,
          rationale: `Hugging Face API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`,
          providerName: this.provider,
          modelName: this.modelName,
        };
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      // Extract the generated text from HF response
      let rawContent = "";
      if (data && data.generated_text) {
        rawContent = data.generated_text;
      } else if (data && Array.isArray(data) && data[0] && data[0].generated_text) {
        rawContent = data[0].generated_text;
      } else if (data && data.message && data.message.content) {
        // Some models return a message object instead
        rawContent = data.message.content;
      }

      console.log(`[HuggingFace - ${this.modelName}] Raw response content:`, rawContent);
      
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
          console.error(`[HuggingFace - ${this.modelName}] Error parsing JSON:`, e);
          // If JSON parsing fails, continue with the raw content
        }
      }
      
      // If the content doesn't look like JSON at all, wrap it in our expected format
      if (!rawContent.startsWith('{') && !rawContent.trim().startsWith('{')) {
        rawContent = `{"answer":"No","confidence":0,"rationale":"${rawContent.replace(/"/g, '\\"')}"}`;  
      }
      
      // Send to response parser
      const { vote, confidence, rationale } = parseVote(rawContent);
      
      console.log(`[HuggingFace - ${this.modelName}] Processed content:`, rawContent);
      console.log(`[HuggingFace - ${this.modelName}] Parsed reply object:`, {
        vote,
        confidence,
        rationale: rationale.length > 100 ? `${rationale.substring(0, 100)}...` : rationale,
      });

      // Process the vote if needed based on query mode
      const finalVote = vote;
      // For predict mode, we want to keep the raw vote
      // For other modes, follow standard processing
      if (req.queryMode !== 'predict') {
        // Fact check and other modes use standard boolean logic
      }

      return {
        vote: finalVote,
        confidence,
        rationale,
        providerName: this.provider,
        modelName: this.modelName,
        latency: latency,
      };
    } catch (error) {
      console.error(`[HuggingFace - ${this.modelName}] Validation error:`, error);
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
