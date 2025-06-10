import { Validator } from "@/lib/types";

export async function fetchValidators(): Promise<Validator[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  let apiUrl: string;

  try {
    apiUrl = new URL("/api/validators", baseUrl).toString();
  } catch {
    console.error("[fetchValidators] Invalid base URL:", baseUrl);
    apiUrl = "http://localhost:3000/api/validators";
  }

  let validators: Validator[] = [];

  try {
    console.log("[fetchValidators] Fetching validators from:", apiUrl);
    const res = await fetch(apiUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[fetchValidators] Failed to fetch validators: ${res.status} ${res.statusText}`);
      const errorText = await res.text();
      console.error("[fetchValidators] Error response:", errorText);
      return [];
    }

    const data = await res.json();
    validators = Array.isArray(data) ? data : (data.validators || []);
    console.log(`[fetchValidators] Fetched ${validators.length} validators`);
  } catch (error) {
    console.error("[fetchValidators] Error fetching validators:", error);
  }

  return validators;
}
