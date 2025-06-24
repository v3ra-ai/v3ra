/**
 * Get the base URL for the application
 * Handles Vercel deployments, custom domains, and local development
 */
export function getURL(): string {
  // Check for explicitly set URL first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // In production, use Vercel URL if available
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // For client-side, use window location
  if (typeof window !== 'undefined') {
    const protocol = window.location.hostname === 'localhost' ? 'http' : 'https';
    return `${protocol}://${window.location.host}`;
  }

  // Default fallback
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : 'https://localhost:3000'; // Fallback to localhost to avoid redirect issues
}

/**
 * Get redirect URL for auth callbacks
 * This should match what's configured in Supabase
 */
export function getAuthCallbackURL(): string {
  const baseURL = getURL();
  return `${baseURL}/auth/callback`;
}