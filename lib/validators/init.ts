import { validatorRegistry } from "./registry";
import {
  OpenAIValidator,
  AnthropicValidator,
  GeminiValidator,
} from "./providers";
import { v4 as uuidv4 } from "uuid";
import { ValidationRequest, AIValidationResponse } from "./types";

// Custom validator for our existing Eliza validator in mock data
class ElizaValidator extends OpenAIValidator {
  constructor() {
    super({
      modelName: "gpt-4o",
      name: "Eliza OS Validator",
      active: true,
    });
    this.id = uuidv4();
    this.name = "Eliza OS Validator";
    this.provider = "Eliza";
    this.modelName = "Eliza OS running on OpenAI 4.5";
    this.description =
      "A specialized agent running on Eliza OS with a Data Scientist character profile, providing insights focused on statistical validity and data integrity.";
    this.validatorType = "Specialized Agent";
  }

  // Override validation to provide Eliza-specific responses
  async validate(request: ValidationRequest): Promise<AIValidationResponse> {
    const response = await super.validate(request);

    // Customize Eliza's response style
    let customRationale = "";
    if (response.vote) {
      customRationale = `Analyzing from a data science perspective: yes, this statement is supported by available data. The statistical validity checks out based on my analysis.`;
    } else {
      customRationale = `From a data integrity standpoint: no, I cannot verify this statement. There appear to be statistical inconsistencies or unsubstantiated claims that require further evidence.`;
    }

    return {
      vote: response.vote,
      confidence: response.confidence,
      rationale: customRationale,
      error: response.error,
      latency: response.latency,
    };
  }
}

// Initialize the registry with default validators
export function initializeValidators() {

  // Add our default validators
  validatorRegistry.addValidator(
    new OpenAIValidator({
      modelName: "gpt-4o",
      name: "GPT-4o Validator",
    }),
  );

  validatorRegistry.addValidator(
    new AnthropicValidator({
      modelName: "claude-3-opus",
      name: "Claude 3 Opus Validator",
    }),
  );

  validatorRegistry.addValidator(new ElizaValidator());

  validatorRegistry.addValidator(
    new GeminiValidator({
      modelName: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash Validator",
    }),
  );


  return validatorRegistry;
}
