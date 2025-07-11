import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { prisma } from "@/lib/database";
import { V3RAPointsService } from "@/lib/services/v3ra-points";

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function validateAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Check if user is admin
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
    const isAdmin = user.email ? adminEmails.includes(user.email) : false;

    return {
      id: user.id,
      email: user.email || '',
      isAdmin,
    };
  } catch (error) {
    console.error('Auth validation failed:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await validateAuth(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!user.isAdmin) {
    throw new Error('Admin access required');
  }
  return user;
}

export function createAuthResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}

export function createUnauthorizedResponse() {
  return createAuthResponse('Authentication required', 401);
}

export function createForbiddenResponse() {
  return createAuthResponse('Access forbidden', 403);
}

export function createAdminRequiredResponse() {
  return createAuthResponse('Admin access required', 403);
}

// Original function for creating or getting users
export async function createOrGetUser(userId: string, email: string, name?: string) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      return { success: true, user: existingUser };
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email,
        name: name || email.split("@")[0], // Use email prefix as default name
        updatedAt: new Date(),
      },
    });

    // Initialize V3RA points for new user
    await V3RAPointsService.getUserPoints(userId);

    return { success: true, user: newUser };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}