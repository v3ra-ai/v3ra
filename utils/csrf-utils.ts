import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export function generateCsrfToken(response: NextResponse): string {
  const token = crypto.randomBytes(32).toString("hex");
  response.cookies.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Relaxed for debugging
    maxAge: 60 * 60, // 1 hour
  });
  console.log("CSRF Token Generated:", {
    token,
    cookieSettings: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
    },
  });
  return token;
}

export function verifyCsrfToken(request: NextRequest): NextResponse | null {
  const tokenFromHeader = request.headers.get("X-CSRF-Token");
  const tokenFromCookie = request.cookies.get("csrf-token")?.value;
  console.log("CSRF Verification:", {
    tokenFromHeader,
    tokenFromCookie,
    cookies: request.cookies.getAll(),
  });
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    console.error("CSRF validation failed:", {
      tokenFromHeader,
      tokenFromCookie,
    });
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 },
    );
  }
  return null;
}