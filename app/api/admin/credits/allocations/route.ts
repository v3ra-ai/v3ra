import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { restrictToAdminEmails } from '@/utils/auth-admin-utils';

// Create Supabase admin client
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for admin operations');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/admin/credits/allocations - Get allocation history
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabaseAdmin = createSupabaseAdmin();
    
    // Build query
    let query = supabaseAdmin
      .from('credit_allocations')
      .select('*')
      .order('allocation_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add date filters if provided
    if (startDate) {
      query = query.gte('allocation_date', startDate);
    }
    if (endDate) {
      query = query.lte('allocation_date', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Admin Credits] Error fetching allocations:', error);
      throw error;
    }

    // Get summary statistics
    const statsQuery = supabaseAdmin
      .from('credit_allocations')
      .select('users_updated, users_failed, users_skipped, total_credits_allocated');
    
    if (startDate) {
      statsQuery.gte('allocation_date', startDate);
    }
    if (endDate) {
      statsQuery.lte('allocation_date', endDate);
    }

    const { data: statsData } = await statsQuery;

    const stats = statsData?.reduce(
      (acc, row) => ({
        total_users_updated: acc.total_users_updated + (row.users_updated || 0),
        total_users_failed: acc.total_users_failed + (row.users_failed || 0),
        total_users_skipped: acc.total_users_skipped + (row.users_skipped || 0),
        total_credits_allocated: acc.total_credits_allocated + (row.total_credits_allocated || 0),
      }),
      {
        total_users_updated: 0,
        total_users_failed: 0,
        total_users_skipped: 0,
        total_credits_allocated: 0,
      }
    );

    return NextResponse.json({
      allocations: data,
      pagination: {
        limit,
        offset,
        total: count,
      },
      statistics: stats,
    });
    
  } catch (error) {
    console.error('[Admin Credits] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocation history' },
      { status: 500 }
    );
  }
}

// POST /api/admin/credits/allocations/status - Check today's allocation status
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const date = body.date || new Date().toISOString().split('T')[0];

    const supabaseAdmin = createSupabaseAdmin();
    
    // Call the status check function
    const { data, error } = await supabaseAdmin.rpc('get_allocation_status', {
      p_date: date
    });

    if (error) {
      console.error('[Admin Credits] Error checking status:', error);
      throw error;
    }

    return NextResponse.json(data);
    
  } catch (error) {
    console.error('[Admin Credits] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check allocation status' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/credits/allocations - Trigger manual allocation (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authorization
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const force = body.force === true;

    // Call the cron endpoint directly with admin auth
    const cronResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cron/daily-credits`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force }),
      }
    );

    const result = await cronResponse.json();

    if (!cronResponse.ok) {
      throw new Error(result.error || 'Failed to trigger allocation');
    }

    return NextResponse.json({
      ...result,
      triggered_by: 'admin',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[Admin Credits] Manual trigger error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to trigger manual allocation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to check admin authorization
async function checkAdminAuth(): Promise<boolean> {
  try {
    const { isAuthorized } = await restrictToAdminEmails();
    return isAuthorized;
  } catch (error) {
    console.error('[Admin Auth] Error checking admin status:', error);
    return false;
  }
}