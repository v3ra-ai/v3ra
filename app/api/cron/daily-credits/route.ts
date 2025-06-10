import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Types
interface AllocationResult {
  success: boolean;
  allocation_date?: string;
  users_updated?: number;
  users_failed?: number;
  users_skipped?: number;
  total_credits_allocated?: number;
  total_users?: number;
  execution_time_ms?: number;
  message?: string;
  error?: string;
  errors?: unknown[];
}

// Create Supabase admin client for service-level operations
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for admin operations');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify authorization - check for cron secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET) {
      console.error('[Daily Credits] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not properly configured' },
        { status: 500 }
      );
    }
    
    if (authHeader !== expectedAuth) {
      console.warn('[Daily Credits] Unauthorized cron attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createSupabaseAdmin();
    
    console.log('[Daily Credits] Starting daily credit allocation...');
    
    // Call the secure database function to allocate credits
    const { data, error } = await supabaseAdmin.rpc('allocate_daily_credits', {
      p_force: false // Don't force if already allocated today
    });
    
    if (error) {
      console.error('[Daily Credits] Database error:', error);
      
      // Check if it's a specific error we can handle
      if (error.message?.includes('already allocated')) {
        return NextResponse.json({
          success: false,
          message: 'Credits already allocated today',
          allocation_date: new Date().toISOString().split('T')[0]
        });
      }
      
      throw error;
    }
    
    const result = data as AllocationResult;
    
    // Log the results
    const executionTime = Date.now() - startTime;
    console.log('[Daily Credits] Allocation completed:', {
      success: result.success,
      users_updated: result.users_updated,
      users_failed: result.users_failed,
      users_skipped: result.users_skipped,
      total_credits: result.total_credits_allocated,
      execution_time: `${executionTime}ms`,
      db_execution_time: `${result.execution_time_ms}ms`
    });
    
    // Send monitoring alerts if there were failures
    if (result.users_failed && result.users_failed > 0) {
      console.error(`[Daily Credits] Failed to allocate credits for ${result.users_failed} users`);
      // TODO: Integrate with monitoring service (e.g., Sentry, DataDog)
    }
    
    // Return success response
    return NextResponse.json({
      ...result,
      api_execution_time_ms: executionTime
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[Daily Credits] Critical error:', error);
    
    // Log to monitoring service
    // TODO: Integrate with error tracking service
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: executionTime
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers (admin only)
export async function POST(request: NextRequest) {
  try {
    // Extra security for manual triggers - could check for admin auth
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const force = body.force === true;
    
    console.log('[Daily Credits] Manual trigger requested', { force });
    
    // Initialize Supabase admin client
    const supabaseAdmin = createSupabaseAdmin();
    
    // Call the allocation function with force parameter
    const { data, error } = await supabaseAdmin.rpc('allocate_daily_credits', {
      p_force: force
    });
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      ...(data as AllocationResult),
      manual_trigger: true,
      forced: force
    });
    
  } catch (error) {
    console.error('[Daily Credits] Manual trigger error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to manually trigger credit allocation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}