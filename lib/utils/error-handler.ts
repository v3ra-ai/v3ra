// Utility for handling errors properly, especially Event objects

export function formatError(error: unknown): string {
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
      return JSON.stringify(error);
    }
    return str;
  }
  
  return String(error);
}

export function logError(context: string, error: unknown) {
  const formattedError = formatError(error);
  console.error(`[${context}]`, formattedError);
  
  // Log additional details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Full error details:', error);
  }
}