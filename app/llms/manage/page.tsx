import ManageLLMsClient from "@/components/llm-management/manage-llms-client";
import { Validator } from "@/lib/types";

export async function fetchValidators(): Promise<Validator[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  let apiUrl: string;

  try {
    apiUrl = new URL("/api/validators", baseUrl).toString();
  } catch {
    console.error("[ManageLLMsPage] Invalid base URL:", baseUrl);
    apiUrl = "http://localhost:3000/api/validators";
  }

  let validators: Validator[] = [];

  try {
    console.log("[ManageLLMsPage] Fetching validators from:", apiUrl);
    const res = await fetch(apiUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }
    validators = await res.json();
    // Ensure active is false to prevent unwanted enabled tags
    validators = validators.map((v) => ({ ...v, active: false }));
    console.log("[ManageLLMsPage] Validators fetched (API):", validators.length, validators);
  } catch {
    console.error("[ManageLLMsPage] Error fetching validators");
    validators = [
      {
        id: "4da9dcd2-d5ea-4150-855a-898f274c597f",
        modelName: "Claude 3 Opus",
        profileName: "Claude 3 Opus Validator",
        provider: "Anthropic",
        active: false,
        avatarUrl: null,
        publicKey: "pub_claude3opus_001",
        isLeader: false,
        description: "Advanced reasoning model by Anthropic",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-06-01T00:00:00Z"),
        validatorType: "model",
        reliability: 0.95,
        totalVotes: 100,
        correctVotes: 95,
      },
      {
        id: "65462fc9-04f8-4a31-9d97-181812e3dcac",
        modelName: "Claude 3 Sonnet",
        profileName: "Claude 3 Sonnet Validator",
        provider: "Anthropic",
        active: false,
        avatarUrl: null,
        publicKey: "pub_claude3sonnet_001",
        isLeader: false,
        description: "Balanced model by Anthropic",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-06-01T00:00:00Z"),
        validatorType: "model",
        reliability: 0.92,
        totalVotes: 80,
        correctVotes: 74,
      },
      {
        id: "c773eebd-85dc-4e8d-92f9-93f0efb2fba1",
        modelName: "GPT-4o",
        profileName: "GPT-4o Validator",
        provider: "OpenAI",
        active: false,
        avatarUrl: null,
        publicKey: "pub_gpt4o_001",
        isLeader: true,
        description: "Multimodal AI by OpenAI",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-06-01T00:00:00Z"),
        validatorType: "model",
        reliability: 0.98,
        totalVotes: 120,
        correctVotes: 118,
      },
      {
        id: "1696ebf0-5b22-4e46-bf63-517f286a1a8a",
        modelName: "Llama 3.1 70B",
        profileName: "Llama 3.1 70B Validator",
        provider: "Meta",
        active: false,
        avatarUrl: null,
        publicKey: "pub_llama31_001",
        isLeader: false,
        description: "Large-scale model by Meta AI",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-06-01T00:00:00Z"),
        validatorType: "model",
        reliability: 0.90,
        totalVotes: 90,
        correctVotes: 81,
      },
      {
        id: "8d501469-9f7f-4c55-ba44-45c26cc0f87e",
        modelName: "Cohere Command-R",
        profileName: "Cohere Command-R Validator",
        provider: "Cohere",
        active: false,
        avatarUrl: null,
        publicKey: "pub_commandr_001",
        isLeader: false,
        description: "Efficient model by Cohere",
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-06-01T00:00:00Z"),
        validatorType: "model",
        reliability: 0.93,
        totalVotes: 70,
        correctVotes: 65,
      },
    ];
    console.log("[ManageLLMsPage] Validators fetched (fallback):", validators.length, validators);
  }

  return validators;
}

export default async function ManageLLMsPage() {
  const validators = await fetchValidators();
  return <ManageLLMsClient initial={validators} />;
}