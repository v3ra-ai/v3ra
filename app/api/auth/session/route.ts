import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
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
}