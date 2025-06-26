export function getAuthCallbackURL(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  
  return `${baseUrl}/auth/callback`;
}