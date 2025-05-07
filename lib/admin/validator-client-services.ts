// Client-side API service for the validator manager
import { AIValidator } from "@/lib/validators/types";

// This type is simplified for what the GET /api/admin/validators returns
export interface ListedValidator {
  id: string;
  profileName: string;
  provider: string;
  modelName: string;
  active: boolean;
}

export interface ValidatorFormData {
  name: string; // maps to profileName
  provider: string;
  modelName: string;
  active?: boolean;
  description?: string;
  validatorType?: string;
  keyId?: string; // If you're managing API key linkage
}

const API_BASE_URL = "/api/admin/validators";

// Ensure we resolve absolute URLs when running in the server environment, where
// the WHATWG fetch implementation requires an absolute URL.
function resolveApiUrl(path: string) {
  // If the path is already absolute (starts with http/https) just return it.
  if (/^https?:\/\//.test(path)) return path;
  // On the server (window is undefined) prepend the site URL so that fetch has
  // a valid absolute target. Fallback to localhost during local development.
  if (typeof window === "undefined") {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    return `${base}${path}`;
  }
  // In the browser a relative path is fine.
  return path;
}

export async function fetchValidators(): Promise<ListedValidator[]> {
  const response = await fetch(resolveApiUrl(API_BASE_URL));
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch validators" }));
    throw new Error(errorData.message);
  }
  return response.json();
}

export async function addValidator(data: ValidatorFormData): Promise<ListedValidator> {
  const response = await fetch(resolveApiUrl(API_BASE_URL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to add validator" }));
    throw new Error(errorData.message);
  }
  return response.json();
}

export async function updateValidator(id: string, data: Partial<ValidatorFormData>): Promise<ListedValidator> {
  // Map 'name' from formData to 'profileName' for the PATCH request if present
  const patchData: Partial<{profileName: string; provider: string; modelName: string}> = {};
  if (data.name) patchData.profileName = data.name;
  if (data.provider) patchData.provider = data.provider;
  if (data.modelName) patchData.modelName = data.modelName;
  // Note: 'active' is handled by the toggle endpoint. Other fields like description, keyId are not in the PATCH /validators/[id] spec.

  const response = await fetch(resolveApiUrl(`${API_BASE_URL}/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to update validator" }));
    throw new Error(errorData.message);
  }
  return response.json();
}

export async function deleteValidator(id: string): Promise<{ message: string }> {
  console.log("Deleting validator with ID:", id);
  const targetUrl = resolveApiUrl(`${API_BASE_URL}/${id}`);
  console.log("Delete request URL:", targetUrl);
  
  const response = await fetch(targetUrl, {
    method: "DELETE",
  });
  console.log("Delete response status:", response.status, response.statusText);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to delete validator" }));
    console.error("Delete error data:", errorData);
    throw new Error(errorData.message);
  }
  return response.json();
}

export async function toggleValidatorActive(id: string, active: boolean): Promise<ListedValidator> {
  const response = await fetch(resolveApiUrl(`${API_BASE_URL}/${id}/toggle`), {
    method: "POST", // As per API spec, can also be PATCH
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to toggle validator status" }));
    throw new Error(errorData.message);
  }
  return response.json();
}

// Placeholder for OpenRouter models fetching
export async function fetchOpenRouterModelsClient(apiKey: string): Promise<any[]> {
  // This is a placeholder. In a real implementation, you'd call an API route that uses the OpenRouter client
  // to fetch models securely without exposing API keys on the client
  console.warn("Using placeholder fetchOpenRouterModelsClient - implement actual API integration");
  return [
    { id: "openrouter/nous-hermes-2-mixtral-8x7b-dpo", name: "Nous Hermes 2 - Mixtral 8x7B DPO" },
    { id: "openai/gpt-4-turbo-preview", name: "GPT-4 Turbo Preview" },
    { id: "google/gemini-pro", name: "Gemini Pro" },
    { id: "mistralai/mistral-7b-instruct", name: "Mistral 7B Instruct" },
  ];
}
