// lib/services/openrouterService.ts

export interface OpenRouterModel {
  id: string; // e.g., "openai/gpt-4-turbo"
  name: string; // e.g., "GPT-4 Turbo"
  description: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
    request?: string;
    image?: string;
  };
  // Add other fields if needed based on API response
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

export async function fetchOpenRouterModels(): Promise<{ id: string; name: string }[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("OpenRouter API key is not set. Returning empty model list.");
    return [];
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to fetch OpenRouter models: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch OpenRouter models: ${response.status} ${response.statusText}`);
    }

    const data: OpenRouterModelsResponse = await response.json();
    
    // We only need id and name for the dropdown
    return data.data.map(model => ({ id: model.id, name: model.name }));

  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    // Depending on desired behavior, you might return an empty list or re-throw
    return []; // Return empty list on error to prevent page crash, log error for debugging
  }
}
