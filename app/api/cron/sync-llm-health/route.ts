import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import LLMHealthService from '@/lib/services/llm-health-service';

// This endpoint can be called by a cron job to sync LLM health metrics
// It ensures health metrics stay in sync with active validators
export async function GET(_request: NextRequest) {
  try {
    // Verify the request is authorized (add your own auth logic here)
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    // For production, implement proper authentication
    // For now, we'll check for a simple bearer token from environment
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting LLM health sync...');
    
    const healthService = LLMHealthService.getInstance();
    
    // Run health checks which includes cleanup
    const results = await healthService.runHealthChecks();
    
    // Get the current system health report
    const report = await healthService.getSystemHealthReport();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        checksPerformed: results.length,
        totalProviders: report.providers.length,
        overallScore: report.overallScore,
        orphanedMetricsCleaned: true
      }
    });
  } catch (error) {
    console.error('[CRON] Error in LLM health sync:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed' 
      },
      { status: 500 }
    );
  }
}