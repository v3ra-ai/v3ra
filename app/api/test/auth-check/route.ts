import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Check cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    const authCookies = allCookies.filter(c => 
      c.name.includes('sb-') || 
      c.name.includes('supabase') ||
      c.name.includes('csrf')
    );

    // Check Supabase auth
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    return NextResponse.json({
      cookies: {
        total: allCookies.length,
        authRelated: authCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value
        }))
      },
      auth: {
        user: user ? {
          id: user.id,
          email: user.email
        } : null,
        error: error?.message || null
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}