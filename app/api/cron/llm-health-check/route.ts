import { NextRequest, NextResponse } from 'next/server';
import { handleCronHealthCheck } from '@/lib/services/llm-health-scheduler';

// This endpoint can be called by cron job services
// Example: Vercel Cron, GitHub Actions, or any external scheduler
// Recommended schedule: Every 30 minutes

export async function GET(request: NextRequest) {
  // Optional: Add authorization check for production
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[Cron] LLM health check triggered');
  
  const result = await handleCronHealthCheck();
  
  return NextResponse.json(result, {
    status: result.success ? 200 : 500
  });
}