/**
 * API route to check if the authenticated user is an admin.
 */

import { NextResponse } from 'next/server';
import { restrictToAdminEmails } from '@/utils/auth-admin-utils';

export async function GET(request: Request) {
  console.log('Check-admin request received:', {
    cookies: request.headers.get('cookie'),
    url: request.url,
  });

  const { isAuthorized, error } = await restrictToAdminEmails();

  if (!isAuthorized) {
    console.log('Check-admin failed:', error);
    return NextResponse.json({ isAdmin: false, message: error }, { status: 401 });
  }

  console.log('Check-admin succeeded');
  return NextResponse.json({ isAdmin: true }, { status: 200 });
}