import DOMPurify from "dompurify";

/**
 * Formats an error into a safe, sanitized error message, defaulting to a fallback message.
 * @param error - The error to format (Error, string, or unknown).
 * @param fallbackMessage - The fallback message to use if error is invalid (default: "An unknown error occurred").
 * @returns A sanitized error message string.
 */
export function formatErrorMessage(
  error: unknown,
  fallbackMessage: string = "An unknown error occurred"
): string {
  let message: string;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = fallbackMessage;
  }
  return DOMPurify.sanitize(message);
}
