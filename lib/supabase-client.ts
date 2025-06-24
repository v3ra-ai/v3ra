import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client
// Support both Vercel's env vars and traditional NEXT_PUBLIC_ prefixed ones
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.SUPABASE_URL || 
                    'https://quuuhdbozcmhkwzhamuh.supabase.co';
                    
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                      process.env.SUPABASE_ANON_KEY || 
                      '';

if (!supabaseAnonKey) {
  console.error('Missing Supabase anonymous key. Please set SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  // Use a placeholder to prevent build errors
  const placeholder = 'missing-anon-key';
  if (typeof window !== 'undefined') {
    throw new Error('Missing Supabase anonymous key. Please set SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  // For server-side, we'll use a placeholder to allow build to continue
  supabaseAnonKey = placeholder;
}

// Custom storage to handle client-side cookies safely
const cookieStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') {
      // console.log(`Storage getItem skipped on server: ${key}`);
      return null;
    }
    const value = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${key}=`))
      ?.split('=')[1];
    // console.log(`Storage getItem: ${key}=${value || 'null'}`);
    return value || null;
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') {
      // console.log(`Storage setItem skipped on server: ${key}`);
      return;
    }
    console.log(`Storage setItem: ${key}=${value}`);
    document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') {
      console.log(`Storage removeItem skipped on server: ${key}`);
      return;
    }
    console.log(`Storage removeItem: ${key}`);
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    storageKey: 'sb-rccfhomdmfbcywrlvgly-auth-token',
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
        } catch (error) {
          console.error('Error setting cookies:', error);
        }
      },
    },
  });
}