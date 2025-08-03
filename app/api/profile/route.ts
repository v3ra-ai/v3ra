import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { prisma } from "@/lib/db/client";
import { apiLogger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Always get user from Supabase session - never trust client-provided userId
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }
    
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true
      }
    });
    
    if (!userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user: userData });
    
  } catch (error) {
    apiLogger.error("Failed to get profile", { error });
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}