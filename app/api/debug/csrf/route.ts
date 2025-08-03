import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const csrfCookie = request.cookies.get('csrf-token');
  
  return NextResponse.json({
    origin,
    referer,
    hasCsrfCookie: !!csrfCookie,
    csrfCookieValue: csrfCookie?.value ? '***' + csrfCookie.value.slice(-4) : null,
    headers: Object.fromEntries(request.headers.entries()),
  });
}