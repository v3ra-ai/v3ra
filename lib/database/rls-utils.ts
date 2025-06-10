/**
 * RLS Testing and Validation Utilities
 * 
 * CRITICAL: These utilities are for testing RLS policies
 * Use with caution in production environments
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface RLSTestResult {
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  userId?: string;
  success: boolean;
  error?: string;
  data?: unknown;
}

export class RLSTestUtils {
  private adminClient: SupabaseClient;
  private anonClient: SupabaseClient;
  
  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    this.adminClient = createClient(supabaseUrl, supabaseServiceKey);
    this.anonClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Test if a user can access their own data
   */
  async testUserDataIsolation(userId: string, otherUserId: string): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    // Create authenticated client for user
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Test User table access
    const ownProfile = await userClient
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();

    results.push({
      table: 'User',
      operation: 'SELECT',
      userId,
      success: !ownProfile.error,
      error: ownProfile.error?.message,
      data: ownProfile.data,
    });

    // Test accessing other user's data
    const otherProfile = await userClient
      .from('User')
      .select('*')
      .eq('id', otherUserId)
      .single();

    results.push({
      table: 'User',
      operation: 'SELECT',
      userId: otherUserId,
      success: !!otherProfile.error, // Should fail
      error: otherProfile.error?.message,
    });

    return results;
  }

  /**
   * Test credit update protection
   */
  async testCreditProtection(userId: string): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    // Try direct update (should fail)
    const directUpdate = await this.anonClient
      .from('User')
      .update({ freeCredits: 9999 })
      .eq('id', userId);

    results.push({
      table: 'User',
      operation: 'UPDATE',
      userId,
      success: !!directUpdate.error, // Should fail
      error: directUpdate.error?.message,
    });

    // Try using secure function (should succeed)
    const secureUpdate = await this.anonClient.rpc('decrement_free_credits', {
      p_user_id: userId,
      p_amount: 1,
      p_reason: 'RLS test',
    });

    results.push({
      table: 'User (via function)',
      operation: 'UPDATE',
      userId,
      success: !secureUpdate.error,
      error: secureUpdate.error?.message,
      data: secureUpdate.data,
    });

    return results;
  }

  /**
   * Test service role access
   */
  async testServiceRoleAccess(): Promise<RLSTestResult[]> {
    const results: RLSTestResult[] = [];

    // Service role should bypass all RLS
    const allUsers = await this.adminClient
      .from('User')
      .select('id')
      .limit(5);

    results.push({
      table: 'User',
      operation: 'SELECT',
      success: !allUsers.error,
      error: allUsers.error?.message,
      data: { count: allUsers.data?.length || 0 },
    });

    return results;
  }

  /**
   * Validate RLS is enabled on critical tables
   */
  async validateRLSEnabled(): Promise<Record<string, boolean>> {
    const { data, error } = await this.adminClient.rpc('get_rls_status');
    
    if (error) {
      console.error('Failed to get RLS status:', error);
      return {};
    }

    const status: Record<string, boolean> = {};
    data?.forEach((row: { tablename: string; rls_enabled: boolean }) => {
      status[row.tablename] = row.rls_enabled;
    });

    return status;
  }

  /**
   * Get detailed RLS status for all tables
   */
  async validateRLSStatus(): Promise<Array<{
    table: string;
    rlsEnabled: boolean;
    policyCount: number;
  }>> {
    const { data, error } = await this.adminClient
      .from('pg_tables')
      .select('tablename,rowsecurity')
      .eq('schemaname', 'public');
    
    if (error) {
      console.error('Failed to get table information:', error);
      return [];
    }

    const result = [];
    for (const table of data || []) {
      // Get policy count
      const { data: policies } = await this.adminClient
        .from('pg_policies')
        .select('*')
        .eq('tablename', table.tablename)
        .eq('schemaname', 'public');
      
      result.push({
        table: table.tablename,
        rlsEnabled: table.rowsecurity || false,
        policyCount: policies?.length || 0
      });
    }

    return result;
  }

  /**
   * Run comprehensive RLS test suite
   */
  async runFullTestSuite(testUserId: string, otherUserId: string): Promise<{
    passed: number;
    failed: number;
    results: RLSTestResult[];
  }> {
    console.log('🧪 Running RLS Test Suite...\n');

    const allResults: RLSTestResult[] = [];

    // Test 1: User data isolation
    console.log('Testing user data isolation...');
    const isolationResults = await this.testUserDataIsolation(testUserId, otherUserId);
    allResults.push(...isolationResults);

    // Test 2: Credit protection
    console.log('Testing credit protection...');
    const creditResults = await this.testCreditProtection(testUserId);
    allResults.push(...creditResults);

    // Test 3: Service role access
    console.log('Testing service role access...');
    const serviceResults = await this.testServiceRoleAccess();
    allResults.push(...serviceResults);

    // Calculate summary
    const passed = allResults.filter(r => r.success).length;
    const failed = allResults.filter(r => !r.success).length;

    // Print results
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('\nDetailed Results:');
    
    allResults.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.table} - ${result.operation}: ${result.error || 'Success'}`);
    });

    return { passed, failed, results: allResults };
  }
}

/**
 * Helper function to create RLS status check
 */
export const createRLSStatusFunction = `
CREATE OR REPLACE FUNCTION get_rls_status()
RETURNS TABLE (
  tablename TEXT,
  rls_enabled BOOLEAN,
  policy_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity as rls_enabled,
    (SELECT COUNT(*)::INTEGER FROM pg_policies p 
     WHERE p.tablename = t.tablename) as policy_count
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

/**
 * Emergency RLS disable function (USE WITH EXTREME CAUTION)
 */
export const emergencyDisableRLS = async (
  adminClient: SupabaseClient,
  tableName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await adminClient.rpc('exec_sql', {
      sql: `ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY;`
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
};
