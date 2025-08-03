/**
 * Database connection configuration for production
 * Uses pgBouncer-compatible connection string with proper pooling
 */

export function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
  
  if (!baseUrl) {
    throw new Error('No database URL found in environment variables');
  }

  // In production, use pgBouncer-compatible settings
  if (process.env.NODE_ENV === 'production') {
    const url = new URL(baseUrl);
    
    // Add pgBouncer-compatible query parameters
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('pool_timeout', '10');
    url.searchParams.set('connection_limit', '25');
    url.searchParams.set('statement_timeout', '30000');
    
    // For Supabase, ensure we're using the pooler endpoint
    if (url.hostname.includes('supabase.co')) {
      // Supabase pooler uses port 6543 instead of 5432
      if (url.port === '5432') {
        url.port = '6543';
      }
    }
    
    return url.toString();
  }
  
  // In development, use direct connection
  return baseUrl;
}

/**
 * Get the direct connection URL (for migrations)
 * Migrations should NOT use pgBouncer
 */
export function getDirectDatabaseUrl(): string {
  const directUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  
  if (!directUrl) {
    throw new Error('No direct database URL found for migrations');
  }
  
  return directUrl;
}