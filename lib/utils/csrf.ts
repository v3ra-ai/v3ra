import { csrfCache } from './cache';

/**
 * Gets or fetches a CSRF token for API requests
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    // Check cache first
    const cached = csrfCache.get('token');
    if (cached) {
      return cached;
    }

    // Fetch new token
    const response = await fetch('/api/csrf-token');
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }

    const data = await response.json();
    const token = data.csrfToken || data.token;

    // Cache for 30 minutes
    if (token) {
      csrfCache.set('token', token);
    }

    return token;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
}

/**
 * Adds CSRF token to fetch headers
 */
export async function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getCSRFToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('X-CSRF-Token', token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}