export async function fetchWithCSRF(url: string, options: RequestInit = {}) {
  // Get CSRF token
  const csrfResponse = await fetch('/api/csrf-token', {
    credentials: 'include'
  });
  
  if (!csrfResponse.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  
  const { csrfToken, token } = await csrfResponse.json();
  const actualToken = csrfToken || token;
  
  if (!actualToken) {
    throw new Error('No CSRF token received');
  }
  
  // Merge headers - use lowercase x-csrf-token to match middleware
  const headers = new Headers(options.headers);
  headers.set('x-csrf-token', actualToken);
  
  // Make request with CSRF token
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
}