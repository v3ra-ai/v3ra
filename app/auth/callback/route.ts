import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-callback');

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const origin = requestUrl.origin;
  
  logger.info('Auth callback received', {
    hasCode: !!code,
    hasTokenHash: !!token_hash,
    type,
    origin,
    url: request.url
  });

  try {
    const supabase = await createSupabaseServerClient();

    // Handle email verification flow
    if (token_hash && type) {
      logger.info('Verifying email token', { type });
      
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as "signup" | "recovery" | "invite" | "email_change" | "email",
      });

      if (error) {
        logger.error('Token verification error:', error);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message || "Invalid or expired link")}`);
      }

      if (data.user) {
        // Create or update user in database
        await createOrUpdateUser(data.user);
        
        // Get the return URL from cookies or default to /ask
        const returnTo = request.cookies.get('authReturnTo')?.value || '/ask';
        const response = NextResponse.redirect(`${origin}${returnTo}`);
        
        // Clear the return URL cookie
        response.cookies.delete('authReturnTo');
        
        return response;
      }
    }

    // Handle OAuth code exchange flow
    if (code) {
      logger.info('Exchanging code for session', { codeLength: code.length });
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        logger.error('Code exchange error:', { 
          error: error.message,
          code: error.code,
          status: error.status
        });
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message || "Failed to exchange code")}`);
      }

      if (data.user) {
        logger.info('User authenticated', {
          userId: data.user.id,
          email: data.user.email,
          hasSession: !!data.session
        });
        
        // Create or update user in database
        await createOrUpdateUser(data.user);
        
        // Check if session was properly set
        const { data: sessionCheck } = await supabase.auth.getSession();
        logger.info('Session check after exchange', {
          hasSession: !!sessionCheck.session,
          userId: sessionCheck.session?.user?.id
        });
        
        // Get the return URL from cookies or default to /ask
        const returnTo = request.cookies.get('authReturnTo')?.value || '/ask';
        const response = NextResponse.redirect(`${origin}${returnTo}`);
        
        // Clear the return URL cookie
        response.cookies.delete('authReturnTo');
        
        logger.info('Auth callback successful, redirecting to:', returnTo);
        return response;
      }
    }

    // No code or token_hash provided
    logger.warn('No code or token_hash in callback');
    return NextResponse.redirect(`${origin}/login?error=No authentication code provided`);
    
  } catch (error) {
    logger.error('Auth callback error:', error);
    return NextResponse.redirect(`${origin}/login?error=Authentication failed`);
  }
}

async function createOrUpdateUser(user: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0],
      }),
    });

    const result = await response.json();
    
    if (!result.success && result.code !== 'USER_EXISTS') {
      logger.error('Failed to create/update user:', result.error);
    } else {
      logger.info('User created/updated successfully');
    }
  } catch (error) {
    logger.error('Error creating/updating user:', error);
  }
}