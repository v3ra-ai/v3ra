import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/query-wrapper";

interface HealthDiagnostics {
  timestamp: string;
  environment: string | undefined;
  database: {
    urls: {
      DATABASE_URL: boolean;
      POSTGRES_PRISMA_URL: boolean;
      POSTGRES_URL: boolean;
    };
    connection: string;
    validators: string;
    voteSessions: string;
  };
  supabase: {
    url: boolean;
    anonKey: boolean;
  };
  error?: string;
}

export async function GET() {
  const diagnostics: HealthDiagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      urls: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
        POSTGRES_URL: !!process.env.POSTGRES_URL,
      },
      connection: "unknown",
      validators: "unknown",
      voteSessions: "unknown"
    },
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  };

  try {
    // Test database connection
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.database.connection = `success (${Date.now() - start}ms)`;

    // Test validators table
    try {
      const validatorCount = await prisma.validator.count();
      diagnostics.database.validators = `${validatorCount} validators found`;
    } catch (error) {
      diagnostics.database.validators = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    // Test vote sessions
    try {
      const voteSessionCount = await prisma.voteSession.count();
      diagnostics.database.voteSessions = `${voteSessionCount} vote sessions found`;
    } catch (error) {
      diagnostics.database.voteSessions = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

  } catch (error) {
    diagnostics.database.connection = `failed: ${error instanceof Error ? error.message : 'unknown'}`;
    diagnostics.error = error instanceof Error ? error.message : 'Database connection failed';
  }

  return NextResponse.json(diagnostics, { 
    status: diagnostics.database.connection.startsWith('success') ? 200 : 500 
  });
}