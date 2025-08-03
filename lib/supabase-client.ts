import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/logger';

const logger = createLogger('supabase-client');

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
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
}

// Check if we have a valid anon key
if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
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
    // Set secure cookies in production
    const isProduction = window.location.protocol === 'https:';
    const cookieOptions = [
      `${key}=${value}`,
      'path=/',
      'max-age=31536000',
      'SameSite=Lax', // Allow cookies on navigation from external sites
      isProduction ? 'Secure' : ''
    ].filter(Boolean).join('; ');
    
    document.cookie = cookieOptions;
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
  try {
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
              // Ensure secure cookie settings
              const secureOptions = {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax' as const,
              };
              cookieStore.set({ name, value, ...secureOptions });
            });
          } catch {
            // Handle cookie setting error silently
          }
        },
      },
    });
  } catch (error) {
    logger.error('Failed to create Supabase server client', error);
    throw error;
  }
}