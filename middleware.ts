import { NextRequest, NextResponse } from "next/server";
import { checkBetaAccess, ALLOWED_PAGES } from "@/lib/beta-access";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log("[middleware] Processing request for:", pathname);

  // Skip beta access check for image files
  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|ico)$/)) {
    console.log("[middleware] Image file, skipping beta check:", pathname);
    return NextResponse.next();
  }

  // Skip beta access check for newrelic.js
  if (pathname === "/newrelic.js") {
    console.log("[middleware] Newrelic.js file, skipping beta check:", pathname);
    return NextResponse.next();
  }

  if (ALLOWED_PAGES.includes(pathname)) {
    console.log("[middleware] Allowed page, skipping beta check:", pathname);
    return NextResponse.next();
  }

  const { isAllowed } = await checkBetaAccess();
  console.log("[middleware] Beta access result:", { isAllowed, pathname });

  if (!isAllowed) {
    console.log("[middleware] Redirecting to beta-info:", { pathname });
    const redirectUrl = new URL("/beta-info", request.url);
    redirectUrl.searchParams.set("reason", "beta_access_denied");
    return NextResponse.redirect(redirectUrl);
  }

  console.log("[middleware] Access granted for:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};