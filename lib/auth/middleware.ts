import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-client";
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
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return createErrorResponse(
        "Authentication required",
        ErrorCode.UNAUTHORIZED,
        401
      );
    }

    // Add user info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.userId = user.id;
    authenticatedRequest.user = user;

    return handler(authenticatedRequest);
  } catch (error) {
    return createErrorResponse(
      "Authentication check failed",
      ErrorCode.INTERNAL_ERROR,
      500
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
    const supabase = await createSupabaseServerClient();
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
        "Admin access required",
        ErrorCode.FORBIDDEN,
        403
      );
    }

    return handler(req);
  });
}