import { supabase } from '../lib/supabase-client';

async function debugAuthIssue() {
  console.log('🔍 Debugging Authentication Issue\n');

  // Check 1: Client-side session
  console.log('1️⃣ Checking client-side session:');
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.log('❌ Session error:', error.message);
  } else if (session) {
    console.log('✅ Session found');
    console.log('   User:', session.user.email);
    console.log('   Access token:', session.access_token ? 'Present' : 'Missing');
    console.log('   Expires at:', new Date(session.expires_at! * 1000).toISOString());
  } else {
    console.log('❌ No session found');
  }

  // Check 2: Auth cookies
  console.log('\n2️⃣ Checking auth cookies:');
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split('; ');
    const authCookies = cookies.filter(c => 
      c.includes('sb-') || c.includes('supabase') || c.includes('csrf')
    );
    
    if (authCookies.length > 0) {
      console.log('✅ Found auth-related cookies:');
      authCookies.forEach(cookie => {
        const [name] = cookie.split('=');
        console.log(`   - ${name}`);
      });
    } else {
      console.log('❌ No auth cookies found');
    }
  }

  // Check 3: Test authenticated API call
  console.log('\n3️⃣ Testing authenticated API call:');
  try {
    // Get CSRF token first
    const csrfResponse = await fetch('/api/csrf-token', {
      credentials: 'include'
    });
    
    if (!csrfResponse.ok) {
      console.log('❌ CSRF token fetch failed:', csrfResponse.status);
      return;
    }
    
    const { csrfToken } = await csrfResponse.json();
    console.log('✅ CSRF token obtained');

    // Test points API
    const pointsResponse = await fetch('/api/user/points', {
      credentials: 'include',
      headers: {
        'x-csrf-token': csrfToken
      }
    });

    if (pointsResponse.ok) {
      const data = await pointsResponse.json();
      console.log('✅ Authenticated API call successful');
      console.log('   Points balance:', data.balance);
    } else {
      console.log('❌ API call failed:', pointsResponse.status);
      const error = await pointsResponse.text();
      console.log('   Error:', error);
    }
  } catch (error) {
    console.log('❌ API test error:', error);
  }

  console.log('\n📋 Troubleshooting steps:');
  console.log('1. Clear all site data (cookies, localStorage)');
  console.log('2. Login again at /login');
  console.log('3. Check browser console for errors');
  console.log('4. Ensure cookies are not blocked by browser');
}

// This script should be run in the browser console
if (typeof window !== 'undefined') {
  debugAuthIssue();
} else {
  console.log('This script must be run in the browser console');
}