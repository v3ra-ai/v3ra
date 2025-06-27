import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client
// Support both Vercel's env vars and traditional NEXT_PUBLIC_ prefixed ones
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                  process.env.SUPABASE_URL || 
                  '';
                    
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                      process.env.SUPABASE_ANON_KEY || 
                      '';

// Check if we have a valid Supabase URL
if (!supabaseUrl) {
  // In development, use the actual Supabase URL as fallback
  if (process.env.NODE_ENV === 'development') {
    supabaseUrl = 'https://rccfhomdmfbcywrlvgly.supabase.co';
  } else {
    // Use a placeholder URL to prevent build errors
    supabaseUrl = 'https://placeholder.supabase.co';
  }
}

// Use a valid placeholder if no key is found to prevent runtime errors
if (!supabaseAnonKey) {
  // Use a properly formatted placeholder (base64 encoded JWT-like string)
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYyMzkwMjIsImV4cCI6MTk2MTgxNTAyMn0.placeholder-key-do-not-use-in-production';
}

// Custom storage to handle client-side cookies safely
const cookieStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') {
      return null;
    }
    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${key}=`))
      ?.split('=')[1];
    return value || null;
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') {
      return;
    }
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') {
      return;
    }
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
  },
};

// Extract project ID from Supabase URL for storage key
const getProjectId = (url: string): string => {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'default';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    storageKey: `sb-${getProjectId(supabaseUrl)}-auth-token`,
  },
});

// Server-side Supabase client for App Router server components
export async function createSupabaseServerClient() {
  // Dynamically import App Router-specific dependencies
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookiesList = cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        return cookiesList;
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, ...options }) => {
            cookieStore.set({ name, value, ...options });
          });
        } catch {
          // Handle cookie setting error silently
        }
      },
    },
  });
}