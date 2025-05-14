import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quuuhdbozcmhkwzhamuh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
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
    storageKey: 'sb-quuuhdbozcmhkwzhamuh-auth-token',
  },
});

// Server-side Supabase client for App Router server components
export async function createSupabaseServerClient() {
  // Dynamically import App Router-specific dependencies
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');

  const cookieStore = await cookies();

  // Debug all cookies retrieved server-side
  const allCookies = cookieStore.getAll();
  console.log("Server-side cookies in createSupabaseServerClient:", allCookies);

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookiesList = cookieStore.getAll().map(({ name, value }) => ({ name, value }));
        console.log("Cookies passed to Supabase getAll:", cookiesList);
        return cookiesList;
      },
      setAll(cookiesToSet) {
        console.log("Cookies to set in Supabase setAll:", cookiesToSet);
        try {
          cookiesToSet.forEach(({ name, value, ...options }) => {
            console.log(`Setting cookie: ${name}=${value}`, options); // Debug log
            cookieStore.set({ name, value, ...options });
          });
        } catch (error) {
          console.error('Error setting cookies:', error);
        }
      },
    },
  });
}