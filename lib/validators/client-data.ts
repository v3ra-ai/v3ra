/**
 * Client-side data provider for validators
 * This avoids importing Prisma directly in browser code
 */
import { AIValidator, ValidationRequest, AIValidationResponse } from "./types";

// Type for API response (AIValidator without validate)
type ValidatorApiResponse = Omit<AIValidator, "validate">;

// Mock validators for initial client-side rendering
const MOCK_VALIDATORS: AIValidator[] = [
  {
    id: "1",
    name: "GPT-4o",
    provider: "OpenAI",
    modelName: "gpt-4o",
    description:
      "OpenAI's most advanced multimodal model, capable of sophisticated reasoning and language understanding.",
    validatorType: "Multimodal Reasoning Engine",
    active: true,
    validate: async () => ({
      vote: true,
      confidence: 0.95,
      rationale: "Response from GPT-4o",
    }),
  },
  {
    id: "2",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    modelName: "claude-3-opus",
    description:
      "Anthropic's most advanced and thoroughly aligned AI assistant, designed for complex tasks.",
    validatorType: "Constitutional AI Reasoner",
    active: true,
    validate: async () => ({
      vote: false,
      confidence: 0.92,
      rationale: "Response from Claude 3",
    }),
  },
  {
    id: "3",
    name: "Eliza",
    provider: "OpenAI",
    modelName: "gpt-4.5-turbo",
    description:
      "Specialized fine-tuned model with extensive data science expertise.",
    validatorType:
      "Specialized Agent — Eliza OS running on OpenAI 4.5 with Data Scientist character profile",
    active: true,
    validate: async () => ({
      vote: true,
      confidence: 0.88,
      rationale: "Response from Eliza",
    }),
  },
];

// Client-side validator functions
export async function getValidators(): Promise<AIValidator[]> {
  try {
    const response = await fetch("/api/validators");
    if (!response.ok) throw new Error("Failed to fetch validators");

    const data = await response.json();

    return data.map((validator: ValidatorApiResponse) => ({
      ...validator,
      validate: createValidateFunction(validator),
    }));
  } catch (error) {
    console.warn("Using mock validators due to error:", error);
    return Promise.resolve(MOCK_VALIDATORS);
  }
}

export async function getActiveValidators(): Promise<AIValidator[]> {
  try {
    const response = await fetch("/api/validators/active");
    if (!response.ok) throw new Error("Failed to fetch active validators");

    const data = await response.json();

    return data.map((validator: ValidatorApiResponse) => ({
      ...validator,
      validate: createValidateFunction(validator),
    }));
  } catch (error) {
    console.warn("Using mock active validators due to error:", error);
    return Promise.resolve(MOCK_VALIDATORS.filter((v) => v.active));
  }
}

export async function toggleValidatorStatus(
  id: string,
  active: boolean,
): Promise<boolean> {
  try {
    const response = await fetch(`/api/validators/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });

    if (!response.ok) throw new Error("Failed to toggle validator status");
    return true;
  } catch (error) {
    console.error("Error toggling validator status:", error);
    return false;
  }
}

// Client-side validation function
function createValidateFunction(validator: {
  id: string;
}): (request: ValidationRequest) => Promise<AIValidationResponse> {
  return async (request: ValidationRequest): Promise<AIValidationResponse> => {
    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validatorId: validator.id,
          statement: request.statement,
          context: request.context,
        }),
      });

      if (!response.ok) throw new Error("Validation request failed");
      return await response.json();
    } catch (error) {
      console.error("Error in validate function:", error);
      return {
        vote: Math.random() > 0.5,
        confidence: 0.5,
        rationale: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  };
}
