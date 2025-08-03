import { NextRequest, NextResponse } from 'next/server';
import { withCSRFProtection } from '@/lib/middleware/csrf';
import { CSRF_CONFIG } from '@/lib/config/csrf';

export const POST = withCSRFProtection(async (request: NextRequest) => {
  return NextResponse.json({ 
    success: true, 
    message: 'CSRF validation passed',
    headers: {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      csrfToken: request.headers.get(CSRF_CONFIG.headerName) ? 'present' : 'missing',
    },
    cookie: {
      name: CSRF_CONFIG.cookie.name,
      value: request.cookies.get(CSRF_CONFIG.cookie.name)?.value ? 'present' : 'missing',
    }
  });
});

export const GET = async (request: NextRequest) => {
  return NextResponse.json({
    info: 'CSRF test endpoint',
    usage: 'POST to this endpoint with proper CSRF token to test',
    config: {
      headerName: CSRF_CONFIG.headerName,
      cookieName: CSRF_CONFIG.cookie.name,
      allowedOrigins: CSRF_CONFIG.allowedOrigins,
    }
  });
};