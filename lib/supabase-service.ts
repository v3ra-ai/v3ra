import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Centralized Supabase service client for administrative operations
 * This client uses the service role key to bypass RLS
 */

let serviceClient: SupabaseClient | null = null;

/**
 * Create or get the Supabase service client singleton
 * Uses service role key for full database access
 */
export function createSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase configuration for service operations. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }
  
  serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
  
  return serviceClient;
}

/**
 * Execute a function with retry logic
 * Implements exponential backoff for transient failures
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-retryable errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt),
          maxDelay
        );
        
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Don't retry authentication errors
    if (error.message.includes('JWT') || error.message.includes('auth')) {
      return true;
    }
    
    // Don't retry validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return true;
    }
    
    // Don't retry permission errors
    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Type-safe RPC function caller with retry
 */
export async function callRPC<T = unknown>(
  functionName: string,
  params?: Record<string, unknown>,
  options?: Parameters<typeof withRetry>[1]
): Promise<T> {
  const client = createSupabaseServiceClient();
  
  return withRetry(
    async () => {
      const { data, error } = await client.rpc(functionName, params);
      
      if (error) {
        throw error;
      }
      
      return data as T;
    },
    options
  );
}