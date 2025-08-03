import { validatorRegistry } from "./registry";
import {
  OpenAIValidator,
  AnthropicValidator,
  GeminiValidator,
} from "./providers";
import { v4 as uuidv4 } from "uuid";
import { ValidationRequest, AIValidationResponse } from "./types";
import { createLogger } from "@/lib/logger";

const logger = createLogger('validators-init');

// Custom validator for our existing Eliza validator in mock data
class ElizaValidator extends OpenAIValidator {
  description?: string;
  validatorType?: string;

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
export async function initializeValidators() {
  logger.info('Adding built-in validators');
  
  // Add our default validators
  const openaiValidator = new OpenAIValidator({
    id: uuidv4(),
    modelName: "gpt-4o",
    name: "GPT-4o Validator",
    active: true,
  });
  (openaiValidator as any).avatarUrl = "/validators/openai.jpg";
  await validatorRegistry.addValidator(openaiValidator);

  const anthropicValidator = new AnthropicValidator({
    id: uuidv4(),
    modelName: "claude-3-opus",
    name: "Claude 3 Opus Validator",
    active: true,
  });
  (anthropicValidator as any).avatarUrl = "/validators/anthropic.jpg";
  await validatorRegistry.addValidator(anthropicValidator);

  const elizaValidator = new ElizaValidator();
  (elizaValidator as any).avatarUrl = "/validators/eliza.jpg";
  await validatorRegistry.addValidator(elizaValidator);

  const geminiValidator = new GeminiValidator({
    id: uuidv4(),
    modelName: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash Validator",
    active: true,
  });
  (geminiValidator as any).avatarUrl = "/validators/gemini.jpg";
  await validatorRegistry.addValidator(geminiValidator);

  logger.info('[initializeValidators] Built-in validators added successfully');
  return validatorRegistry;
}
