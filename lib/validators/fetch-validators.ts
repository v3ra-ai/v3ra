import { Validator } from "@/lib/types";

export async function fetchValidators(): Promise<Validator[]> {
  let apiUrl: string;

  // In browser, use relative URL
  if (typeof window !== 'undefined') {
    apiUrl = "/api/validators";
  } else {
    // Server-side: use full URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    apiUrl = `${baseUrl}/api/validators`;
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
