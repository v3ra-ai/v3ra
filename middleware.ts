import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Simply pass through all requests - no beta access check
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};