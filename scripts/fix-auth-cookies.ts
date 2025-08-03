import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('=== Supabase Auth Cookie Fix ===\n');

// Create a browser client with proper cookie handling
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get(name: string) {
      const value = parseCookieHeader(document.cookie)[name];
      console.log(`Getting cookie ${name}:`, value ? 'found' : 'not found');
      return value;
    },
    set(name: string, value: string, options: any) {
      console.log(`Setting cookie ${name} with options:`, options);
      document.cookie = serializeCookie(name, value, {
        ...options,
        sameSite: 'lax',
        path: '/',
      });
    },
    remove(name: string, options: any) {
      console.log(`Removing cookie ${name}`);
      document.cookie = serializeCookie(name, '', {
        ...options,
        maxAge: 0,
        path: '/',
      });
    },
  },
});

// Helper functions
function parseCookieHeader(str: string): Record<string, string> {
  const output: Record<string, string> = {};
  str.split(/; */).forEach((pair) => {
    const eqIdx = pair.indexOf('=');
    if (eqIdx >= 0) {
      const key = pair.slice(0, eqIdx).trim();
      let val = pair.slice(eqIdx + 1, pair.length).trim();
      if (val[0] === '"') val = val.slice(1, -1);
      output[key] = decodeURIComponent(val);
    }
  });
  return output;
}

function serializeCookie(name: string, value: string, options: any = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  
  return parts.join('; ');
}

// Test the client
async function testAuth() {
  console.log('\n1. Testing getSession()...');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  console.log('Session:', sessionData.session ? 'Found' : 'Not found');
  if (sessionError) console.log('Session error:', sessionError.message);
  
  console.log('\n2. Testing getUser()...');
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log('User:', userData.user ? 'Found' : 'Not found');
  if (userError) console.log('User error:', userError.message);
  
  console.log('\n3. Current cookies:');
  document.cookie.split('; ').forEach(cookie => {
    if (cookie.includes('sb-') || cookie.includes('csrf')) {
      console.log(' -', cookie.split('=')[0]);
    }
  });
  
  console.log('\n4. Testing auth persistence to API...');
  try {
    const response = await fetch('/api/test/auth-check', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    console.log('API auth check:', data.auth?.user ? 'Authenticated' : 'Not authenticated');
  } catch (error) {
    console.log('API check failed:', error);
  }
}

// Instructions for use
console.log(`
To use this fix:

1. Open the browser console
2. Copy and paste this entire script
3. Run testAuth() to check current state
4. If not authenticated, login at /login
5. Run testAuth() again to verify

The script will show detailed cookie operations.
`);

// Export for console use
(window as any).testAuth = testAuth;
(window as any).supabase = supabase;