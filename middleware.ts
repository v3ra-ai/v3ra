import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  // Get the pathname
  const pathname = request.nextUrl.pathname;
  
  // Protected routes that require authentication
  const protectedRoutes = ['/ask', '/profile'];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirect to login with return URL
      const url = new URL('/login', request.url);
      url.searchParams.set('returnTo', pathname);
      url.searchParams.set('reason', 'auth_required');
      return NextResponse.redirect(url);
    }
  }
  
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};