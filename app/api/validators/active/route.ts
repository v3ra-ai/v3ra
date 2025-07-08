// app/api/validators/active/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { rateLimitRelaxed } from "@/lib/middleware/rate-limit";

// GET /api/validators/active - Get active validators with pagination
export const GET = rateLimitRelaxed(async (request: NextRequest) => {
  try {
    // Get pagination parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, Math.min(100, limit)); // Cap at 100 for safety
    
    // Fetch active validators from database
    const skip = (validPage - 1) * validLimit;
    const [validators, total] = await Promise.all([
      prisma.validator.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: validLimit,
        select: {
          id: true,
          profileName: true,
          provider: true,
          modelName: true,
          description: true,
          validatorType: true,
          avatarUrl: true,
          active: true,
          reliability: true,
          totalVotes: true,
          correctVotes: true,
          publicKey: true,
        }
      }),
      prisma.validator.count({ where: { active: true } })
    ]);

    console.log(`[validators/active] Found ${validators.length} active validators`);

    // Convert validators to JSON-friendly format
    const formattedValidators = validators.map(
      (validator) => {
        // Line 10: Typed
        return {
          id: validator.id,
          name: validator.profileName,
          profileName: validator.profileName, // Add profileName for compatibility with LLM store
          provider: validator.provider,
          modelName: validator.modelName || "unknown",
          description: validator.description || undefined,
          validatorType: validator.validatorType || undefined,
          active: validator.active !== undefined ? validator.active : true,
          keyId: validator.publicKey || undefined, // Use publicKey as keyId for compatibility
          avatarUrl: validator.avatarUrl || undefined,
          // validate function omitted as it’s not serializable
        };
      },
    );

    return NextResponse.json({
      validators: formattedValidators,
      pagination: {
        page: validPage,
        limit: validLimit,
        total: total,
        hasMore: skip + validators.length < total
      }
    });
  } catch (error) {
    console.error("Error getting active validators:", error);
    return NextResponse.json(
      { error: "Failed to fetch active validators" },
      { status: 500 },
    );
  }
});
