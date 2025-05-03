"use server";

import { prisma } from "@/lib/db/client";
import { User } from "@prisma/client";

interface CheckDuplicateResult {
  success: boolean;
  error?: string;
  existingUser?: boolean;
  field?: "email" | "username";
}

/**
 * Checks for duplicate email or username in the User table.
 * @param email - The email to check.
 * @param username - The username to check.
 * @returns An object indicating success, error, or duplicate field.
 */
export async function checkDuplicateUser(email: string, username: string): Promise<CheckDuplicateResult> {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name: username }],
      },
    });

    if (existingUser) {
      return {
        success: true,
        existingUser: true,
        field: existingUser.email === email ? "email" : "username",
      };
    }

    return { success: true, existingUser: false };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to check duplicates" };
  }
}

/**
 * Creates or retrieves a user in the User table.
 * @param userId - The Supabase user ID.
 * @param email - The user's email.
 * @param username - The user's username (optional, defaults to email prefix).
 * @returns The user object or an error.
 */
export async function createOrGetUser(
  userId: string,
  email: string,
  username?: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Check if user exists
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      // Create new user
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email: email || "",
          name: username || email.split("@")[0] || "User",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return { success: true, user: dbUser };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message || "Failed to create/get user" };
  }
}