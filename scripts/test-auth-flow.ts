import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Testing Supabase Auth Flow...\n');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

// Test with different cookie configurations
const testConfigs = [
  {
    name: 'Default (Lax)',
    auth: {
      storage: {
        getItem(key: string) {
          console.log('  Getting item:', key);
          return null;
        },
        setItem(key: string, value: string) {
          console.log('  Setting item:', key, 'with value length:', value.length);
        },
        removeItem(key: string) {
          console.log('  Removing item:', key);
        }
      },
      storageKey: `sb-rccfhomdmfbcywrlvgly-auth-token`,
    }
  }
];

async function testAuth() {
  for (const config of testConfigs) {
    console.log(`\nTesting with ${config.name} configuration:`);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, config);
    
    // Test getting current session
    console.log('Getting current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('Session error:', sessionError.message);
    } else {
      console.log('Session exists:', !!sessionData.session);
      if (sessionData.session) {
        console.log('User ID:', sessionData.session.user.id);
        console.log('Expires at:', new Date(sessionData.session.expires_at! * 1000).toISOString());
      }
    }
    
    // Test getting user
    console.log('\nGetting current user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('User error:', userError.message);
    } else {
      console.log('User exists:', !!userData.user);
      if (userData.user) {
        console.log('User ID:', userData.user.id);
        console.log('Email:', userData.user.email);
      }
    }
  }
}

testAuth().catch(console.error);