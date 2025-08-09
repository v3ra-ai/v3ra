import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Create server client
    const supabase = await createSupabaseServerClient();
    
    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 401 });
    }
    
    // Check if session was created
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Check cookies
    const cookieStore = await cookies();
    const authCookies = cookieStore.getAll().filter(c => c.name.includes('sb-'));
    
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email
      },
      session: {
        exists: !!data.session,
        accessToken: !!data.session?.access_token
      },
      sessionCheck: {
        exists: !!sessionData.session,
        userId: sessionData.session?.user?.id
      },
      cookies: {
        count: authCookies.length,
        names: authCookies.map(c => c.name)
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const cookieStore = await cookies();
    const authCookies = cookieStore.getAll().filter(c => c.name.includes('sb-'));
    
    return NextResponse.json({
      authenticated: !!user,
      user: user ? {
        id: user.id,
        email: user.email
      } : null,
      cookies: {
        count: authCookies.length,
        names: authCookies.map(c => c.name)
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
}