import { VoteResult } from "@/lib/types";
import DOMPurify from "dompurify";

export function sanitizeQueryText(text: string): string {
  if (typeof window === "undefined") {
    // Server-side: enhanced sanitization
    return text
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
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
    // Remove sensitive information from error messages
    const message = error.message
      .replace(/\/[\w\/]+\//g, '/****/') // Hide file paths
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '***.***.***.***') // Hide IPs
      .replace(/:[0-9]+/g, ':****') // Hide ports
      .replace(/password['":\s]*[^,}\s]*/gi, 'password: ****') // Hide passwords
      .replace(/key['":\s]*[^,}\s]*/gi, 'key: ****'); // Hide API keys
    
    return sanitizeQueryText(message);
  }
  if (typeof error === "string") {
    return sanitizeQueryText(error);
  }
  return "An unexpected error occurred";
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize file paths
 */
export function sanitizeFilePath(path: string): string {
  return path
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/[<>"|?*]/g, '') // Remove invalid characters
    .replace(/\\/g, '/') // Normalize slashes
    .trim();
}