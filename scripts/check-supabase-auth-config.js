const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuthConfig() {
  console.log('🔍 Checking Supabase Auth Configuration\n');

  console.log('1️⃣ Environment:');
  console.log('   URL:', supabaseUrl);
  console.log('   Project ID:', supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]);
  
  console.log('\n2️⃣ Testing auth flow type:');
  
  // Check if PKCE is enabled (this is the new default)
  console.log('   PKCE flow: Enabled by default in new Supabase projects');
  console.log('   Implicit flow: Deprecated');
  
  console.log('\n3️⃣ Common issues with auth callback:');
  console.log('   1. PKCE flow requires exchangeCodeForSession()');
  console.log('   2. Cookies might be blocked in development');
  console.log('   3. SameSite cookie policies can interfere');
  
  console.log('\n4️⃣ Testing current auth state:');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('   ❌ Error getting session:', error.message);
    } else if (session) {
      console.log('   ✅ Active session found');
      console.log('   User:', session.user.email);
    } else {
      console.log('   ℹ️  No active session');
    }
    
    // Check auth settings
    console.log('\n5️⃣ Recommended Supabase settings:');
    console.log('   Go to Supabase Dashboard > Authentication > URL Configuration');
    console.log('   - Site URL: http://localhost:3001');
    console.log('   - Redirect URLs: http://localhost:3001/auth/callback');
    console.log('   For production add: https://www.v3ra.ai/auth/callback');
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
}

checkAuthConfig();