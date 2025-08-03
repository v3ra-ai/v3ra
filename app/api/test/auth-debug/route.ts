import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { cookies } from 'next/headers';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-debug');

export async function GET() {
  try {
    // 1. Check all cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // 2. Filter auth-related cookies
    const authCookies = allCookies.filter(c => 
      c.name.includes('sb-') || 
      c.name.includes('supabase') ||
      c.name.includes('csrf')
    );

    // 3. Check Supabase auth
    const supabase = await createSupabaseServerClient();
    
    // Try multiple auth checks
    const sessionCheck = await supabase.auth.getSession();
    const userCheck = await supabase.auth.getUser();
    
    // 4. Check cookie parsing
    const cookieDebugInfo = authCookies.map(c => ({
      name: c.name,
      valueLength: c.value?.length || 0,
      valuePreview: c.value ? c.value.substring(0, 20) + '...' : 'empty'
    }));

    // 5. Check if we can decode the JWT token
    let tokenInfo = null;
    const tokenCookie = authCookies.find(c => c.name.includes('auth-token'));
    if (tokenCookie?.value) {
      try {
        // Parse the cookie value which might be base64url encoded
        const decodedCookie = decodeURIComponent(tokenCookie.value);
        const tokenData = JSON.parse(decodedCookie);
        tokenInfo = {
          hasAccessToken: !!tokenData.access_token,
          hasRefreshToken: !!tokenData.refresh_token,
          provider: tokenData.provider_token ? 'oauth' : 'email'
        };
      } catch (e) {
        tokenInfo = { error: 'Failed to parse token cookie' };
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      cookies: {
        total: allCookies.length,
        authRelated: authCookies.length,
        details: cookieDebugInfo
      },
      supabase: {
        session: {
          exists: !!sessionCheck.data?.session,
          error: sessionCheck.error?.message || null,
          user: sessionCheck.data?.session?.user ? {
            id: sessionCheck.data.session.user.id,
            email: sessionCheck.data.session.user.email,
            lastSignIn: sessionCheck.data.session.user.last_sign_in_at
          } : null
        },
        user: {
          exists: !!userCheck.data?.user,
          error: userCheck.error?.message || null,
          details: userCheck.data?.user ? {
            id: userCheck.data.user.id,
            email: userCheck.data.user.email
          } : null
        }
      },
      tokenInfo,
      recommendations: []
    };

    // Add recommendations based on the state
    if (!authCookies.length) {
      response.recommendations.push('No auth cookies found. User needs to login.');
    }
    if (authCookies.length > 0 && !sessionCheck.data?.session) {
      response.recommendations.push('Auth cookies exist but no session. Cookies might be invalid or expired.');
    }
    if (sessionCheck.data?.session && !userCheck.data?.user) {
      response.recommendations.push('Session exists but user check failed. Possible token issue.');
    }
    
    logger.info('Auth debug complete', { 
      hasSession: !!sessionCheck.data?.session,
      hasUser: !!userCheck.data?.user,
      cookieCount: authCookies.length 
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Auth debug error', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}