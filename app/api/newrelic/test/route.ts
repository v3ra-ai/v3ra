// app/api/test/route.ts
import { NextResponse } from 'next/server';
import newrelic from 'newrelic';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { filterUndefined } from '@/utils/filter-utils';
import { restrictToAdminEmails } from '@/utils/auth-admin-utils';
import { truncateText } from '@/utils/text-utils';
import { TestRouteEventAttributes } from '@/lib/types';

export async function GET(request: Request) {
  // Start a timer for response time
  const startTime = performance.now();

  // Check authentication and authorization
  const { isAuthorized, error: authorizationError, user } = await restrictToAdminEmails();
  const userId = user?.id;
  const userEmail = user?.email;
  const supabaseIsAuthenticated = !!user;

   const shortUserId = truncateText(userId,12);

  // If not authorized, return error and log to New Relic
  if (!isAuthorized) {
    const eventAttributes: TestRouteEventAttributes = {
      time: new Date().toISOString(),
      route: '/api/test',
      method: request.method,
      environment: process.env.NODE_ENV || 'unknown',
      vercelDeploymentId: process.env.VERCEL_GIT_COMMIT_SHA,
      shortUserId,
      userEmail,
      queryParams: JSON.stringify(Object.fromEntries(new URL(request.url).searchParams)),
      responseTimeMs: Math.round(performance.now() - startTime),
      supabaseQuerySuccess: false,
      supabaseRowCount: 0,
      supabaseErrorMessage: undefined,
      supabaseIsAuthenticated,
      isAuthorized,
      authorizationError,
      requestOrigin: request.headers.get('origin') || 'unknown',
      userAgent: request.headers.get('user-agent')?.slice(0, 100) || 'unknown',
      isMobile: /mobile/i.test(request.headers.get('user-agent') || ''),
    };

    newrelic.recordCustomEvent('TestRouteAccessed', filterUndefined(eventAttributes));
    newrelic.noticeError(new Error(authorizationError));

    return NextResponse.json(
      { error: 'Unauthorized', message: authorizationError },
      { status: 401 },
    );
  }

  // Initialize Supabase server client
  const supabase = await createSupabaseServerClient();
  let supabaseQuerySuccess = false;
  let supabaseRowCount = 0;
  let supabaseErrorMessage: string | undefined;

  // Proceed with Supabase query if authorized
  const { data, error } = await supabase
    .from('User') // e.g., 'users' or 'posts'
    .select('id, name')
    .limit(10);

  if (error) {
    supabaseErrorMessage = error.message;
    newrelic.noticeError(new Error(error.message));
  } else {
    supabaseQuerySuccess = true;
    supabaseRowCount = data?.length ?? 0;
  }

  // Extract query parameters
  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams);

  // Calculate response time
  const responseTimeMs = Math.round(performance.now() - startTime);

  // Verbose custom event attributes
  const eventAttributes: TestRouteEventAttributes = {
    time: new Date().toISOString(),
    route: '/api/test',
    method: request.method,
    environment: process.env.NODE_ENV || 'unknown',
    vercelDeploymentId: process.env.VERCEL_GIT_COMMIT_SHA,
    userId,
    userEmail,
    queryParams: JSON.stringify(queryParams),
    responseTimeMs,
    supabaseQuerySuccess,
    supabaseRowCount,
    supabaseErrorMessage,
    supabaseIsAuthenticated,
    isAuthorized,
    authorizationError: undefined,
    requestOrigin: request.headers.get('origin') || 'unknown',
    userAgent: request.headers.get('user-agent')?.slice(0, 100) || 'unknown',
    isMobile: /mobile/i.test(request.headers.get('user-agent') || ''),
  };

  // Record custom event
  newrelic.recordCustomEvent('TestRouteAccessed', filterUndefined(eventAttributes));

  // Return response
  return NextResponse.json(
    {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY ? 'Set' : 'Not set',
      appName: process.env.NEW_RELIC_APP_NAME || 'Not set',
      supabaseData: data ?? null,
      supabaseError: supabaseErrorMessage,
      isAuthenticated: supabaseIsAuthenticated,
      userEmail,
    },
    { status: error ? 500 : 200 },
  );
}