// app/api/admin/health-check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createErrorResponse } from "@/lib/utils";

export async function GET() {
  try {
    console.log("Attempting database connection...");
    const validators = await prisma.validator.findMany({ take: 1 });
    console.log("Query result:", validators);
    return NextResponse.json({ status: "healthy", count: validators.length });
  } catch (error) {
    console.error("Health check failed:", error);
    return createErrorResponse(error);
  }
}
