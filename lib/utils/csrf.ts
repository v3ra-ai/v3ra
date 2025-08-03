import { createLogger } from '@/lib/logger';

const logger = createLogger('csrf');

/**
 * Get CSRF token from the API
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include', // Changed to 'include' to ensure cookies are sent
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      logger.error('Failed to fetch CSRF token', { status: response.status });
      try {
        const errorData = await response.json();
        logger.error('CSRF token error', errorData);
      } catch {
        logger.error('CSRF token error: Unable to parse response');
      }
      return null;
    }
    
    const data = await response.json();
    const token = data.csrfToken || data.token || null;
    
    if (!token) {
      logger.error('CSRF token not found in response:', data);
    }
    
    return token;
  } catch (error) {
    logger.error('Error fetching CSRF token:', error);
    return null;
  }
}

/**
 * Add CSRF token to fetch headers
 */
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = await getCSRFToken();
  
  if (!csrfToken) {
    logger.error('CSRF token not available');
    throw new Error('CSRF token not available');
  }
  
  const headers = new Headers(options.headers);
  headers.set('x-csrf-token', csrfToken);
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Changed to 'include' to ensure cookies are sent
  });
}