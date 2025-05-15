"use server";

import { prisma } from "@/lib/db/client";
import { User } from "@prisma/client";

interface CheckDuplicateResult {
  success: boolean;
  error?: string;
  existingUser?: boolean;
  field?: "email" | "username";
  user?: User;
}

/**
 * Checks for duplicate email or username in the User table.
 * @param email - The email to check.
 * @param username - The username to check.
 * @returns An object indicating success, error, or duplicate field with user if found.
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
        user: existingUser,
      };
    }

    return { success: true, existingUser: false };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("checkDuplicateUser error:", err.message, err.stack);
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
    if (!userId) {
      throw new Error("Invalid user ID provided.");
    }

    if (!email) {
      throw new Error("Email is required.");
    }

    // Check for duplicates
    const duplicateCheck = await checkDuplicateUser(email, username || email.split("@")[0]);
    if (duplicateCheck.existingUser && duplicateCheck.user) {
      console.log("Duplicate user found:", {
        userId,
        email,
        username,
        existingUserId: duplicateCheck.user.id,
        field: duplicateCheck.field,
      });
      // Verify userId matches to avoid mismatches
      if (duplicateCheck.user.id !== userId) {
        throw new Error("User ID mismatch for existing email.");
      }
      return { success: true, user: duplicateCheck.user };
    }

    // Check if user exists by ID
    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      const defaultUsername = username || email.split("@")[0] || "User";
      console.log("Creating new user:", { userId, email, username: defaultUsername });

      // Create new user
      dbUser = await prisma.user.create({
        data: {
          id: userId,
          email,
          name: defaultUsername,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log("User created:", dbUser);
    } else {
      console.log("User already exists by ID:", dbUser);
    }

    return { success: true, user: dbUser };
  } catch (error: unknown) {
    const err = error as Error;
    console.error("createOrGetUser error:", err.message, err.stack);
    return { success: false, error: err.message || "Failed to create/get user" };
  }
}