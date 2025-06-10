/**
 * Credit System Configuration Constants
 * Centralized configuration for the daily credit allocation system
 */

export const CREDIT_CONFIG = {
  // Credit allocation settings
  DAILY_FREE_CREDITS: parseInt(process.env.MAX_FREE_CREDITS || '10'),
  RESET_INTERVAL_HOURS: 24,
  
  // Batch processing settings
  DEFAULT_BATCH_SIZE: 1000,
  MAX_BATCH_SIZE: 5000,
  BATCH_DELAY_MS: 10,
  
  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 1000,
  RETRY_MAX_DELAY_MS: 10000,
  
  // Timeout settings
  CRON_TIMEOUT_MS: 55000, // 55 seconds (under Vercel's 60s limit)
  API_TIMEOUT_MS: 30000,  // 30 seconds for API calls
  
  // Rate limiting
  ADMIN_RATE_LIMIT_PER_MINUTE: 10,
  MANUAL_TRIGGER_RATE_LIMIT_PER_HOUR: 5,
  
  // Monitoring
  ERROR_RETENTION_DAYS: 30,
  MAX_ERROR_DETAILS_SIZE: 1000, // characters
} as const;

/**
 * Database table names
 */
export const TABLES = {
  USER: 'User',
  USER_CREDIT: 'UserCredit',
  CREDIT_ALLOCATIONS: 'credit_allocations',
  PAYMENT_LOG: 'PaymentLog',
  AUDIT_LOG: 'audit_log',
} as const;

/**
 * API Response status codes
 */
export const API_STATUS = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
} as const;

/**
 * Cron job status types
 */
export const ALLOCATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const;

/**
 * Type definitions for type safety
 */
export type AllocationStatus = typeof ALLOCATION_STATUS[keyof typeof ALLOCATION_STATUS];

export interface AllocationResult {
  success: boolean;
  allocation_date: string;
  users_updated: number;
  users_failed: number;
  users_skipped: number;
  total_credits_allocated: number;
  total_users: number;
  execution_time_ms: number;
  errors?: Array<{
    user_id: string;
    error: string;
    timestamp: string;
  }>;
}

export interface CreditAllocationRecord {
  id: number;
  allocation_date: string;
  users_updated: number;
  users_failed: number;
  users_skipped: number;
  total_credits_allocated: number;
  execution_time_ms: number | null;
  error_details: unknown[] | null;
  created_at: string;
}