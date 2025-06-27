import { NextResponse } from "next/server";
import { createOrGetUser } from "@/lib/auth-helpers";

export async function POST(request: Request) {
  try {
    const { userId, email, username } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await createOrGetUser(userId, email, username);
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    // Handle duplicate user error
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ 
        success: false, 
        error: "User already exists",
        code: "USER_EXISTS"
      });
    }
    
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}