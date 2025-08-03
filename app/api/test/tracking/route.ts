import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { rateLimitRelaxed } from '@/lib/rate-limit/index';

export const GET = rateLimitRelaxed(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  try {
    switch (action) {
      case 'sentry-test':
        // Test Sentry error capture
        Sentry.captureMessage('Test message from V3RA', 'info');
        return NextResponse.json({ 
          message: 'Sentry test message sent',
          timestamp: new Date().toISOString(),
        });
        
      case 'sentry-error':
        // Test Sentry error capture
        throw new Error('Test error from V3RA tracking endpoint');
        
      case 'sentry-transaction':
        // Test Sentry performance monitoring
        await Sentry.startSpan({
          name: 'test-transaction',
          op: 'test',
        }, async () => {
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 100));
        });
        
        return NextResponse.json({ 
          message: 'Sentry transaction sent',
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json({ 
          message: 'Tracking test endpoint',
          availableActions: ['sentry-test', 'sentry-error', 'sentry-transaction'],
          sentryEnabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
          hotjarEnabled: !!process.env.NEXT_PUBLIC_HOTJAR_ID,
          environment: process.env.NODE_ENV,
        });
    }
  } catch (error) {
    // This will be captured by Sentry
    throw error;
  }
});