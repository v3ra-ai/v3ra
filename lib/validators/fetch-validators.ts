import { Validator } from "@/lib/types";
import { createLogger } from "@/lib/logger";

const logger = createLogger('fetch-validators');

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
    const res = await fetch(apiUrl, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      logger.error('Failed to fetch validators', { status: res.status, statusText: res.statusText });
      const errorText = await res.text();
      logger.error("[fetchValidators] Error response:", errorText);
      return [];
    }

    const data = await res.json();
    validators = Array.isArray(data) ? data : (data.validators || []);
  } catch (error) {
    logger.error("[fetchValidators] Error fetching validators:", error);
  }

  return validators;
}
