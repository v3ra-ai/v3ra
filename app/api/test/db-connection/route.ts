import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { createLogger } from "@/lib/logger";

const logger = createLogger('db-test');

export async function GET() {
  try {
    // Test 1: Basic connection
    await prisma.$connect();
    
    // Test 2: Check ai_models table
    const tableCheck = await prisma.$queryRaw<[{ exists: boolean }]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_models'
      );
    `;
    
    let modelCount = 0;
    let functionWorks = false;
    
    if (tableCheck[0]?.exists) {
      // Test 3: Count models
      const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM ai_models;
      `;
      modelCount = Number(countResult[0].count);
      
      // Test 4: Test function
      try {
        const functionTest = await prisma.$queryRaw<any[]>`
          SELECT * FROM get_blind_test_pair('SMART');
        `;
        functionWorks = Array.isArray(functionTest) && functionTest.length > 0;
      } catch (err) {
        logger.error('Function test failed', { error: err });
      }
    }
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        ai_models_table_exists: tableCheck[0]?.exists || false,
        model_count: modelCount,
        get_blind_test_pair_works: functionWorks
      },
      environment: {
        has_database_url: !!process.env.DATABASE_URL,
        has_direct_url: !!process.env.POSTGRES_URL_NON_POOLING,
        node_env: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    logger.error('Database connection test failed', { error });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        has_database_url: !!process.env.DATABASE_URL,
        has_direct_url: !!process.env.POSTGRES_URL_NON_POOLING,
        node_env: process.env.NODE_ENV
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}