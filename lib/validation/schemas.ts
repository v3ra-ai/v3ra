import { z } from 'zod';
import { isValidUUID } from '@/utils/security-utils';
import { voteModelValidator } from './dynamic-model-validator';
import { PAIRING_STRATEGIES } from '@/lib/constants/pairing-strategies';

// Vote submission schema
export const voteSubmitSchema = z.object({
  voteSessionId: z.string().refine(isValidUUID, 'Invalid vote session ID'),
  winningValidatorId: voteModelValidator,
  losingValidatorId: voteModelValidator,
  voteReason: z.enum(['accuracy', 'conciseness', 'overall', 'creativity', 'technical']),
  voteStrength: z.number().int().min(1).max(5).default(3),
  timeToDecide: z.number().min(0).max(600), // Max 10 minutes
});

// Blind test query schema
export const blindTestQuerySchema = z.object({
  queryText: z.string()
    .min(1, 'Query cannot be empty')
    .max(1000, 'Query too long')
    .transform((str) => str.trim()),
  pairingStrategy: z.enum(Object.values(PAIRING_STRATEGIES) as [string, ...string[]]).default('SMART'),
});

// User points schema
export const userPointsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Leaderboard schema
export const leaderboardQuerySchema = z.object({
  timeframe: z.enum(['all', 'weekly', 'daily']).default('all'),
  limit: z.number().int().min(1).max(100).default(10),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  username: z.string()
    .min(3, 'Username too short')
    .max(20, 'Username too long')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z.string()
    .max(500, 'Bio too long')
    .optional(),
});

// Query parameters for GET endpoints
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Sanitize and validate all string inputs
export function sanitizeString(input: string): string {
  // Remove any potential script tags or HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// Helper to validate request body
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await request.json();
    const result = await schema.safeParseAsync(body);
    
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { data: null, error: errors };
    }
    
    return { data: result.data, error: null };
  } catch {
    return { data: null, error: 'Invalid JSON body' };
  }
}

// Helper to validate query parameters
export async function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: string | null }> {
  const params = Object.fromEntries(searchParams.entries());
  const result = await schema.safeParseAsync(params);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { data: null, error: errors };
  }
  
  return { data: result.data, error: null };
}