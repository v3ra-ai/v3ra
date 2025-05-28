// app/api/admin/health-check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createErrorResponse } from "@/lib/utils";

export async function GET() {
  try {
    console.log("Attempting database connection...");
    
    // Test database connection with a simple query
    const validators = await prisma.validator.findMany({ 
      take: 1,
      select: { id: true } // Only select what we need
    });
    
    console.log("Successfully connected to database");
    
    return NextResponse.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        validatorCount: await prisma.validator.count()
      }
    });
    
  } catch (error) {
    console.error("Health check failed:", error);
    
    // More detailed error information
    const errorInfo = {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      // Check if it's a Prisma client initialization error
      isPrismaClientInitializationError: error instanceof Error && 
        error.name === 'PrismaClientInitializationError',
    };
    
    return NextResponse.json(
      { 
        status: "error",
        message: "Database connection failed",
        error: errorInfo
      },
      { status: 500 }
    );
  }
}
