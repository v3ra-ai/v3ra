import { prisma } from './client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('query-wrapper');

// Wrapper to add timeout to queries
export async function withTimeout<T>(
  queryPromise: Promise<T>,
  timeoutMs: number = 8000 // 8 seconds default
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Query timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([queryPromise, timeoutPromise]);
}

// Helper function for safe database queries
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  timeoutMs: number = 8000
): Promise<T> {
  try {
    return await withTimeout(queryFn(), timeoutMs);
  } catch (error) {
    logger.error('Database query failed', error);
    return fallback;
  }
}

export { prisma };