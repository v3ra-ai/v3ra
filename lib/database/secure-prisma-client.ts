/**
 * Secure Prisma Client Wrapper
 * 
 * This wrapper ensures that critical operations like credit modifications
 * go through security-definer functions instead of direct updates
 */

import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface CreditOperationResult {
  success: boolean;
  previousCredits?: number;
  newCredits?: number;
  error?: string;
}

export class SecurePrismaClient extends PrismaClient {
  private supabaseAdmin: SupabaseClient;
  
  constructor() {
    super();
    
    // Initialize Supabase admin client for secure operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration for secure operations');
    }
    
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Securely decrement user's free credits
   * Uses security definer function to prevent direct manipulation
   */
  async decrementFreeCredits(
    userId: string, 
    amount: number, 
    reason?: string
  ): Promise<CreditOperationResult> {
    try {
      const { data, error } = await this.supabaseAdmin.rpc('decrement_free_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason
      });

      if (error) {
        console.error('[SecurePrisma] Credit decrement error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        previousCredits: data?.previous_credits as unknown as number,
        newCredits: data?.new_credits as unknown as number
      };
    } catch (err: unknown) {
      console.error('[SecurePrisma] Unexpected error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * Securely reset user's free credits
   * Uses security definer function with proper audit logging
   */
  async resetFreeCredits(userId: string): Promise<{
    success: boolean;
    freeCredits?: number;
    reset?: boolean;
    nextResetDate?: Date;
    error?: string;
  }> {
    try {
      const { data, error } = await this.supabaseAdmin.rpc('reset_free_credits', {
        p_user_id: userId
      });

      if (error) {
        console.error('[SecurePrisma] Credit reset error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        freeCredits: data?.freeCredits as unknown as number,
        reset: data?.reset as unknown as boolean,
        nextResetDate: data?.nextResetDate ? new Date(data.nextResetDate) : undefined
      };
    } catch (err: unknown) {
      console.error('[SecurePrisma] Reset credits error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to reset credits'
      };
    }
  }

  /**
   * Override the update method for User table to prevent direct credit updates
   */
  get user() {
    const originalUser = super.user;
    
    return new Proxy(originalUser, {
      get: (target, prop) => {
        if (prop === 'update') {
          return new Proxy(target.update, {
            apply: (updateFn, thisArg, args) => {
              const [params] = args;
              
              // Check if trying to update freeCredits directly
              const paramsData = (params as { data?: { freeCredits?: number } })?.data;
              if (paramsData?.freeCredits !== undefined) {
                console.error('[SecurePrisma] BLOCKED: Direct freeCredits update attempt');
                throw new Error(
                  'Direct credit updates are not allowed. Use decrementFreeCredits() or resetFreeCredits() methods.'
                );
              }
              
              // Allow other updates
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return updateFn.apply(thisArg, args as any);
            }
          });
        }
        
        if (prop === 'updateMany') {
          return new Proxy(target.updateMany, {
            apply: (updateFn, thisArg, args) => {
              const [params] = args;
              
              // Check if trying to update freeCredits directly
              const paramsData = (params as { data?: { freeCredits?: number } })?.data;
              if (paramsData?.freeCredits !== undefined) {
                console.error('[SecurePrisma] BLOCKED: Direct freeCredits bulk update attempt');
                throw new Error(
                  'Direct credit updates are not allowed. Use the secure credit management methods.'
                );
              }
              
              // Allow other updates
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return updateFn.apply(thisArg, args as any);
            }
          });
        }
        
        // Pass through all other methods
        return target[prop as keyof typeof target];
      }
    });
  }

  /**
   * Check if RLS is properly configured for critical operations
   */
  async validateRLSConfiguration(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check if security functions exist
      const { data: functions, error: funcError } = await this.supabaseAdmin.rpc('get_rls_status');
      
      if (funcError) {
        issues.push('Cannot verify RLS status: ' + funcError.message);
      }

      // Check critical tables
      const criticalTables = ['User', 'UserCredit', 'PaymentLog'];
      
      if (functions) {
        for (const table of functions) {
          if (criticalTables.includes(table.table_name)) {
            if (!table.rls_enabled) {
              issues.push(`RLS not enabled on critical table: ${table.table_name}`);
            } else if (table.policy_count === 0) {
              issues.push(`No RLS policies on critical table: ${table.table_name}`);
            }
          }
        }
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (err: unknown) {
      return {
        isValid: false,
        issues: ['Failed to validate RLS configuration: ' + (err instanceof Error ? err.message : 'Unknown error')]
      };
    }
  }

  private handleError(error: unknown): { success: false; error: string } {
    console.error('[SecurePrisma] Database error:', error);
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'Unknown database error' };
  }

  private parsePrismaRawResult(result: unknown[]): { success: boolean; data?: Record<string, unknown> } {
    if (!result || !Array.isArray(result) || result.length === 0) {
      return { success: false };
    }
    
    const row = result[0] as Record<string, unknown>;
    
    return { success: true, data: row };
  }
}

// Export a singleton instance
let securePrismaClient: SecurePrismaClient | null = null;

export function getSecurePrismaClient(): SecurePrismaClient {
  if (!securePrismaClient) {
    securePrismaClient = new SecurePrismaClient();
  }
  return securePrismaClient;
}

// Helper function to migrate existing code
export async function migrateToSecureClient(
  oldPrisma: PrismaClient
): Promise<SecurePrismaClient> {
  console.log('[SecurePrisma] Migrating to secure client...');
  
  // Disconnect old client
  await oldPrisma.$disconnect();
  
  // Return new secure client
  return getSecurePrismaClient();
}
