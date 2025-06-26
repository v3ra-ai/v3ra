import { VoteResult } from "@/lib/types";
import DOMPurify from "dompurify";

export function sanitizeQueryText(text: string): string {
  if (typeof window === "undefined") {
    // Server-side: basic sanitization
    return text.replace(/<[^>]*>/g, "");
  }
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

export function sanitizeValidatorResponse(response: any): any {
  if (!response) return response;
  
  return {
    ...response,
    profileName: sanitizeQueryText(response.profileName || ""),
    provider: sanitizeQueryText(response.provider || ""),
    id: sanitizeQueryText(response.id || ""),
    rationale: sanitizeQueryText(response.rationale || ""),
  };
}

export function sanitizeError(error: any): string {
  if (error instanceof Error) {
    return sanitizeQueryText(error.message);
  }
  if (typeof error === "string") {
    return sanitizeQueryText(error);
  }
  return "An unknown error occurred";
}