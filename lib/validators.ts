import type { Validator } from "./types";
import {
  callOpenAI,
  callClaude,
  callSearchBasedLLM,
  simulateLlmResponse,
} from "./llmIntegration";

// Generate a random public key for validators
function generatePublicKey(): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const prefix = "0x";
  let result = prefix;

  // Generate a 64-character string for the public key
  for (let i = 0; i < 64; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

// Define validator profiles with specific model versions
export const validatorProfiles = [
  { provider: "OpenAI-gpt3.5", profileName: "scientist" },
  { provider: "OpenAI-gpt4", profileName: "philosopher" },
  { provider: "Claude-claude2", profileName: "economist" },
  { provider: "Claude-claude3", profileName: "futurist" },
  { provider: "Search", profileName: "skeptic" },
  { provider: "OpenAI-gpt3.5", profileName: "humanitarian" },
  { provider: "Claude-claude2", profileName: "traditionalist" },
  { provider: "Search", profileName: "environmentalist" },
  { provider: "OpenAI-gpt4", profileName: "pragmatist" },
  { provider: "Claude-claude3", profileName: "artist" },
];

// Create a specified number of validators
export function createValidators(count: number = 8): Validator[] {
  const validators: Validator[] = [];

  for (let i = 0; i < count; i++) {
    validators.push({
      id: `validator-${i + 1}`,
      publicKey: generatePublicKey(),
      isLeader: i === 0, // First validator is the initial leader
      provider: "",
      profileName: "",
      modelName: "",
      description: null,
      avatarUrl: null,
      validatorType: null,
      reliability: null,
      totalVotes: 0,
      correctVotes: 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastVote: null,
      lastRationale: null,
      lastResponse: null,
    });
  }

  return assignValidatorProfiles(validators);
}

// Rotate the leader to the next validator
export function rotateLeader(
  validators: Validator[],
  currentLeader: number,
): number {
  // Mark current leader as not leader
  validators[currentLeader].isLeader = false;

  // Move to next validator (in a circular fashion)
  const nextLeader = (currentLeader + 1) % validators.length;
  validators[nextLeader].isLeader = true;

  return nextLeader;
}

// Extract model from provider string
function getModelFromProvider(provider: string): {
  llmProvider: string;
  model: string;
} {
  if (provider.startsWith("OpenAI")) {
    const parts = provider.split("-");
    if (parts.length > 1 && parts[1]) {
      return {
        llmProvider: "OpenAI",
        model: parts[1] === "gpt4" ? "gpt-4" : "gpt-3.5-turbo",
      };
    }
    return { llmProvider: "OpenAI", model: "gpt-3.5-turbo" };
  }

  if (provider.startsWith("Claude")) {
    const parts = provider.split("-");
    if (parts.length > 1 && parts[1]) {
      return {
        llmProvider: "Claude",
        model: parts[1] === "claude3" ? "claude-3-sonnet-20240229" : "claude-2",
      };
    }
    return { llmProvider: "Claude", model: "claude-2" };
  }

  return { llmProvider: provider, model: "" };
}

// Simulate a validator answering a query and voting using LLMs
export async function simulateValidatorResponse(
  validator: Validator,
  query: string,
): Promise<Validator> {
  try {
    let decision: boolean = false;
    let rationale: string = "";

    // Extract provider and model information
    const { llmProvider, model } = getModelFromProvider(validator.provider);

    // Call different LLM providers based on validator's assigned provider
    if (llmProvider === "OpenAI") {
      const response = await callOpenAI(validator.profileName, query, model);
      decision = response.decision;
      rationale = response.rationale;
    } else if (llmProvider === "Claude") {
      const response = await callClaude(validator.profileName, query, model);
      decision = response.decision;
      rationale = response.rationale;
    } else if (llmProvider === "Search") {
      const response = await callSearchBasedLLM(validator.profileName, query);
      decision = response.decision;
      rationale = response.rationale;
    } else {
      // Fallback for any undefined providers
      const response = simulateLlmResponse("balanced", query);
      decision = response.decision;
      rationale = response.rationale;
    }

    // Update the validator with the response
    return {
      ...validator,
      lastVote: decision,
      lastResponse: decision ? "Yes" : "No",
      lastRationale: rationale,
    };
  } catch (error) {
    console.error(
      `Error simulating validator ${validator.id} response:`,
      error,
    );

    // In case of error, provide a fallback response
    return {
      ...validator,
      lastVote: Math.random() < 0.5,
      lastResponse: "Error occurred",
      lastRationale: "Unable to process this query due to a technical issue.",
    };
  }
}

// Calculate consensus from votes
export function calculateConsensus(validators: Validator[]): {
  votesYes: number;
  votesNo: number;
  consensus: "Yes" | "No" | "Tie";
} {
  let votesYes = 0;
  let votesNo = 0;

  for (const validator of validators) {
    if (validator.lastVote === true) {
      votesYes++;
    } else if (validator.lastVote === false) {
      votesNo++;
    }
  }

  let consensus: "Yes" | "No" | "Tie" = "Tie";
  if (votesYes > votesNo) {
    consensus = "Yes";
  } else if (votesNo > votesYes) {
    consensus = "No";
  }

  return { votesYes, votesNo, consensus };
}

// Assign profiles to validators (for LLM integration)
export function assignValidatorProfiles(validators: Validator[]): Validator[] {
  const profileCount = validatorProfiles.length;

  return validators.map((validator, index) => {
    const profileIndex = index % profileCount;
    return {
      ...validator,
      provider: validatorProfiles[profileIndex].provider,
      profileName: validatorProfiles[profileIndex].profileName,
    };
  });
}