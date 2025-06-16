import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import LLMHealthService from '@/lib/services/llm-health-service';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('[API] Getting LLM health dashboard data');
    
    const healthService = LLMHealthService.getInstance();
    const report = await healthService.getSystemHealthReport();
    
    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('[API] Error fetching LLM health data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch health data' 
      },
      { status: 500 }
    );
  }
}

// Trigger manual health check
export async function POST() {
  try {
    console.log('[API] Triggering manual LLM health check');
    
    const healthService = LLMHealthService.getInstance();
    const results = await healthService.runHealthChecks();
    
    return NextResponse.json({
      success: true,
      data: {
        checksPerformed: results.length,
        results: results
      }
    });
  } catch (error) {
    console.error('[API] Error running health checks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to run health checks' 
      },
      { status: 500 }
    );
  }
}