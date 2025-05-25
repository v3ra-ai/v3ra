import DOMPurify from 'dompurify';
import { VoteResult } from '@/lib/types';
import { SendTransactionError } from '@solana/web3.js';
import crypto from 'crypto';

// Ensure DOMPurify is only used client-side
const isClient = typeof window !== 'undefined';
const sanitizer = isClient ? DOMPurify : { sanitize: (input: string) => input };

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
  if (!queryText) return '';
  try {
    return sanitizer.sanitize(queryText); // Single argument
  } catch (error) {
    console.warn('DOMPurify.sanitize failed:', error, 'Input:', queryText);
    return queryText; // Fallback: return original text
  }
}

/**
 * Sanitizes validator response fields to prevent XSS, returning a sanitized response object.
 * @param response - The validator response object to sanitize.
 * @returns A sanitized validator response object.
 */
export function sanitizeValidatorResponse(
  response: VoteResult['validatorResponses'][number]
): VoteResult['validatorResponses'][number] {
  try {
    return {
      ...response,
      profileName: sanitizer.sanitize(response.profileName), // Single argument
      provider: sanitizer.sanitize(response.provider),
      id: sanitizer.sanitize(response.id),
      rationale: sanitizer.sanitize(response.rationale || ''),
    };
  } catch (error) {
    console.warn('DOMPurify.sanitize failed for response:', error, 'Input:', response);
    return response; // Fallback: return original response
  }
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
  return 'Unknown error occurred';
}