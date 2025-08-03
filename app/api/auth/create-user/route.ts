import { NextResponse } from "next/server";
import { createOrGetUser } from "@/lib/auth-helpers";
import { rateLimitStrict } from "@/lib/rate-limit/index";
import { createLogger } from "@/lib/logger";

const logger = createLogger("auth-create-user");

export const POST = rateLimitStrict(async (request: Request) => {
  try {
    const { userId, email, username } = await request.json();

    if (!userId || !email) {
      logger.warn({ userId, email }, "Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    logger.info({ userId, email, username }, "Creating or getting user");
    const result = await createOrGetUser(userId, email, username);
    
    if (!result.success) {
      logger.error({ userId, error: result.error }, "Failed to create/get user");
      
      // Handle duplicate user error
      if (result.error?.includes("already exists")) {
        return NextResponse.json({ 
          success: false, 
          error: "User already exists",
          code: "USER_EXISTS"
        });
      }
      
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create user" },
        { status: 500 }
      );
    }
    
    logger.info({ userId }, "User created/retrieved successfully");
    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    // Log the full error
    logger.error({ 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, "Failed to create/get user");

    // Handle duplicate user error
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ 
        success: false, 
        error: "User already exists",
        code: "USER_EXISTS"
      });
    }
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 500 }
    );
  }
});