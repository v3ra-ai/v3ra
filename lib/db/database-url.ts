// This file helps ensure we have a DATABASE_URL set for Prisma
// Vercel's Supabase integration uses different env var names

export function getDatabaseUrl(): string {
  // Prefer pooled connection for serverless environments
  const url = process.env.DATABASE_URL || 
              process.env.POSTGRES_PRISMA_URL || 
              process.env.POSTGRES_URL;
  
  if (!url) {
    throw new Error(
      'No database URL found. Please set DATABASE_URL or POSTGRES_PRISMA_URL'
    );
  }
  
  return url;
}

// Set DATABASE_URL if it's not already set (for Prisma compatibility)
// Prefer POSTGRES_PRISMA_URL (pooled) over POSTGRES_URL (direct)
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_PRISMA_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;
  } else if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
  }
}