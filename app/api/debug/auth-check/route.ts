import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { createLogger } from "@/lib/logger";

const logger = createLogger('debug-auth-check');

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Get all cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = cookieHeader.split(';').map(c => {
      const [name, value] = c.trim().split('=');
      return { name, hasValue: !!value, length: value?.length || 0 };
    });
    
    const authCookies = cookies.filter(c => c.name?.includes('sb-'));
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        user: session?.user?.email,
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
        error: sessionError?.message
      },
      user: {
        exists: !!user,
        email: user?.email,
        id: user?.id,
        error: userError?.message
      },
      cookies: {
        total: cookies.length,
        authCookies: authCookies,
        hasCsrfToken: cookies.some(c => c.name?.includes('csrf'))
      },
      headers: {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        userAgent: request.headers.get('user-agent')
      }
    });
  } catch (error) {
    logger.error('Auth check error', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}