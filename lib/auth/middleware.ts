import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ErrorCode, createErrorResponse } from "@/lib/utils/api-errors";

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  user?: any;
}

/**
 * Middleware to check if a user is authenticated
 * Returns the user object if authenticated, otherwise returns an error response
 */
export async function requireAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return createErrorResponse(
        ErrorCode.UNAUTHORIZED,
        "Authentication required"
      );
    }

    // Add user info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.userId = user.id;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest);
  } catch (error) {
    return createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      "Authentication check failed"
    );
  }
}

/**
 * Optional auth middleware - continues even if user is not authenticated
 * but adds user info to request if available
 */
export async function optionalAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const authenticatedRequest = request as AuthenticatedRequest;
    if (user) {
      authenticatedRequest.userId = user.id;
      authenticatedRequest.user = user;
    }

    return handler(authenticatedRequest);
  } catch (error) {
    // Continue without auth on error
    return handler(request as AuthenticatedRequest);
  }
}

/**
 * Admin-only middleware - checks if user is authenticated and is an admin
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, async (req) => {
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    
    if (!req.user?.email || !adminEmails.includes(req.user.email)) {
      return createErrorResponse(
        ErrorCode.FORBIDDEN,
        "Admin access required"
      );
    }

    return handler(req);
  });
}