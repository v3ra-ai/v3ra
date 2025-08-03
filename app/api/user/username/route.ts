import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const logger = createLogger('user-username');

// Username validation schema
const usernameSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .transform(val => val.toLowerCase()) // Store usernames in lowercase
});

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = usernameSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { username } = validation.data;
    
    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    
    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }
    
    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        username,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true
      }
    });
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
    
  } catch (error) {
    logger.error('Update username error', error);
    return NextResponse.json(
      { error: "Failed to update username" },
      { status: 500 }
    );
  }
}

// GET endpoint to check username availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    
    if (!username) {
      return NextResponse.json(
        { error: "Username parameter required" },
        { status: 400 }
      );
    }
    
    // Validate username format
    const validation = usernameSchema.safeParse({ username });
    
    if (!validation.success) {
      return NextResponse.json({
        available: false,
        error: validation.error.errors[0].message
      });
    }
    
    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username: validation.data.username },
      select: { id: true }
    });
    
    return NextResponse.json({
      available: !existingUser,
      username: validation.data.username
    });
    
  } catch (error) {
    logger.error('Check username error', error);
    return NextResponse.json(
      { error: "Failed to check username" },
      { status: 500 }
    );
  }
}