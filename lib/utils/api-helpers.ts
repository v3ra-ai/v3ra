export async function fetchWithCSRF(url: string, options: RequestInit = {}) {
  // Get CSRF token
  const csrfResponse = await fetch('/api/csrf-token');
  const { token: csrfToken } = await csrfResponse.json();
  
  // Merge headers
  const headers = {
    ...options.headers,
    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
  };
  
  // Make request with CSRF token
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
}