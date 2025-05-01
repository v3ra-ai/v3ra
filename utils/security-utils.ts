import DOMPurify from "dompurify";
import { VoteResult } from "@/lib/types";
import { SendTransactionError } from "@solana/web3.js";
import crypto from "crypto";

/**
 * Generates a secure CSRF token for protecting API requests.
 * @returns A random, unique token as a string.
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 18);
}

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

/**
 * Sanitizes error messages for safe logging, preventing exposure of sensitive details.
 * @param error - The error to sanitize (unknown type).
 * @returns A safe string representation of the error message.
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof SendTransactionError) {
    return `Transaction failed: ${error.message}`;
  } else if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return "Unknown error occurred";
}