import LLMHealthService from './llm-health-service';

/**
 * LLM Health Check Scheduler
 * 
 * This module sets up automated health checks for LLM models.
 * In production, this would typically be handled by a cron job service
 * like Vercel Cron, AWS EventBridge, or a dedicated job scheduler.
 */

export class LLMHealthScheduler {
  private static instance: LLMHealthScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private healthService: LLMHealthService;
  
  private constructor() {
    this.healthService = LLMHealthService.getInstance();
  }
  
  public static getInstance(): LLMHealthScheduler {
    if (!LLMHealthScheduler.instance) {
      LLMHealthScheduler.instance = new LLMHealthScheduler();
    }
    return LLMHealthScheduler.instance;
  }

  /**
   * Start automated health checks
   * @param intervalMinutes - How often to run health checks (default: 30 minutes)
   */
  public start(intervalMinutes: number = 30): void {
    if (this.intervalId) {
      console.log('[LLM Health Scheduler] Already running');
      return;
    }

    console.log(`[LLM Health Scheduler] Starting automated health checks every ${intervalMinutes} minutes`);
    
    // Run initial check
    this.runHealthCheck();
    
    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runHealthCheck();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automated health checks
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[LLM Health Scheduler] Stopped automated health checks');
    }
  }

  /**
   * Run a single health check
   */
  private async runHealthCheck(): Promise<void> {
    console.log('[LLM Health Scheduler] Running scheduled health check');
    
    try {
      const results = await this.healthService.runHealthChecks();
      
      // Log summary
      const summary = {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        degraded: results.filter(r => r.status === 'degraded').length,
        deprecated: results.filter(r => r.status === 'deprecated').length,
        offline: results.filter(r => r.status === 'offline').length
      };
      
      console.log('[LLM Health Scheduler] Health check completed:', summary);
      
      // Check for critical issues
      if (summary.deprecated > 0 || summary.offline > 0) {
        console.error('[LLM Health Scheduler] CRITICAL: Found deprecated or offline models!');
        // In production, this would trigger alerts (email, Slack, PagerDuty, etc.)
      }
      
    } catch (error) {
      console.error('[LLM Health Scheduler] Error during health check:', error);
    }
  }
}

/**
 * API Route Handler for Cron Jobs
 * 
 * This can be called by external cron services (Vercel Cron, GitHub Actions, etc.)
 * Example: GET /api/cron/llm-health-check
 */
export async function handleCronHealthCheck(): Promise<{
  success: boolean;
  summary?: {
    timestamp: string;
    total: number;
    healthy: number;
    degraded: number;
    deprecated: number;
    offline: number;
    issues: Array<{
      provider: string;
      model: string;
      status: string;
      latency?: number;
      error?: string;
      httpStatus?: number;
    }>;
  };
  error?: string;
}> {
  try {
    const healthService = LLMHealthService.getInstance();
    const results = await healthService.runHealthChecks();
    
    const summary = {
      timestamp: new Date().toISOString(),
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
      deprecated: results.filter(r => r.status === 'deprecated').length,
      offline: results.filter(r => r.status === 'offline').length,
      issues: results.filter(r => r.status !== 'healthy')
    };
    
    return { success: true, summary };
  } catch (error) {
    console.error('[Cron Health Check] Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export default LLMHealthScheduler;