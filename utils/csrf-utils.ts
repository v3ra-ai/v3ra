import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Generates a secure CSRF token and sets it in a secure, HTTP-only cookie
 * @returns The generated CSRF token
 */
export function generateCsrfToken(response: NextResponse): string {
  const token = crypto.randomBytes(32).toString("hex");
  response.cookies.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60, // 1 hour
  });
  return token;
}

/**
 * Verifies the CSRF token from the request header against the cookie
 * @param request - The incoming Next.js request
 * @returns NextResponse with 403 status if invalid, null if valid
 */
export function verifyCsrfToken(request: NextRequest): NextResponse | null {
  const tokenFromHeader = request.headers.get("X-CSRF-Token");
  const tokenFromCookie = request.cookies.get("csrf-token")?.value;

  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return NextResponse.json(
      { error: "Invalid or missing CSRF token" },
      { status: 403 },
    );
  }
  return null;
}