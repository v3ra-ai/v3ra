// Utility for handling errors properly, especially Event objects
import { createLogger } from '@/lib/logger';

const logger = createLogger('error-handler');

export function formatError(error: unknown): string {
  // Handle Event objects that might be thrown as errors
  if (typeof error === 'object' && error !== null && 'isTrusted' in error) {
    // This is likely a DOM Event object thrown as an error
    logger.warn('Event object thrown as error. This usually indicates an async handler issue.');
    return 'An unexpected event error occurred. Please try again.';
  }
  
  // Handle Event objects (like ErrorEvent)
  if (error instanceof Event && 'message' in error) {
    const errorEvent = error as ErrorEvent;
    return errorEvent.message || 'Unknown error event';
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  // Handle promise rejection events
  if (error && typeof error === 'object' && 'reason' in error) {
    return formatError((error as any).reason);
  }
  
  // Convert to string
  if (error && typeof error.toString === 'function') {
    const str = error.toString();
    // Avoid [object Object] or [object Event]
    if (str === '[object Object]' || str === '[object Event]') {
      // Try to extract meaningful info
      try {
        return JSON.stringify(error);
      } catch {
        return 'Unknown error object';
      }
    }
    return str;
  }
  
  return String(error);
}

export function logError(context: string, error: unknown) {
  const formattedError = formatError(error);
  logger.error('Error occurred', { context, error: formattedError });
  
  // Log additional details in development
  if (process.env.NODE_ENV === 'development') {
    logger.error('Full error details:', error);
  }
}