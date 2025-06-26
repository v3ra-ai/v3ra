import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    // Generate a simple CSRF token
    const csrfToken = randomBytes(32).toString("hex");
    
    // Create response with token
    const response = NextResponse.json({ csrfToken }, { status: 200 });
    
    // Set cookie
    response.cookies.set("csrf-token", csrfToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    return response;
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json({ error: "Failed to generate CSRF token" }, { status: 500 });
  }
}