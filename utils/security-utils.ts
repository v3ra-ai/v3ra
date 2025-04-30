import DOMPurify from "dompurify";
import { VoteResult } from "@/lib/types";

/**
 * Sanitizes query text to prevent XSS by removing or escaping dangerous characters.
 * @param queryText - The query text to sanitize (string or undefined).
 * @returns A sanitized string, or an empty string if input is null/undefined.
 */
export function sanitizeQueryText(queryText: string | undefined): string {
  return DOMPurify.sanitize(queryText ?? "");
}

/**
 * Sanitizes validator response fields to prevent XSS, returning a sanitized response object.
 * @param response - The validator response object to sanitize.
 * @returns A sanitized validator response object.
 */
export function sanitizeValidatorResponse(
  response: VoteResult["validatorResponses"][number]
): VoteResult["validatorResponses"][number] {
  return {
    ...response,
    profileName: DOMPurify.sanitize(response.profileName),
    provider: DOMPurify.sanitize(response.provider),
    id: DOMPurify.sanitize(response.id),
    rationale: DOMPurify.sanitize(response.rationale || ""),
  };
}
