import { NextResponse } from 'next/server';
import LLMHealthService from '@/lib/services/llm-health-service';
import { llmHealthCache } from '@/lib/cache/internal-cache';

export async function GET() {
  try {
    console.log('[API] Getting LLM health dashboard data');
    
    // Check cache first
    const cacheKey = 'llm-health-dashboard';
    const cachedData = llmHealthCache.get(cacheKey);
    
    if (cachedData) {
      console.log('[API] Returning cached LLM health data');
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }
    
    const healthService = LLMHealthService.getInstance();
    const report = await healthService.getSystemHealthReport();
    
    // Cache for 30 seconds
    llmHealthCache.set(cacheKey, report, 30);
    
    return NextResponse.json({
      success: true,
      data: report,
      cached: false
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
    
    // Clear cache when running manual health check
    llmHealthCache.delete('llm-health-dashboard');
    
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