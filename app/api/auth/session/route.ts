import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { rateLimitAuth } from "@/lib/middleware/rate-limit";

export const GET = rateLimitAuth(async () {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ userId: null, authenticated: false });
    }
    
    return NextResponse.json({
      userId: user.id,
      email: user.email,
      authenticated: true
    });
    
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ userId: null, authenticated: false });
  }
});