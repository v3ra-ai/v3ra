#!/usr/bin/env node

// This script ensures DATABASE_URL is set for Prisma
// It runs at build time to map Vercel's env vars to what Prisma expects

console.log('[Database Setup] Checking database environment variables...');

// Check what we have
const vars = {
  DATABASE_URL: process.env.DATABASE_URL,
  PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL,
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
};

console.log('[Database Setup] Available database URLs:');
Object.entries(vars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✓ Set' : '✗ Not set'}`);
});

// Set DATABASE_URL if not already set
if (!process.env.DATABASE_URL) {
  // Prefer pooled connection for serverless
  const dbUrl = process.env.POSTGRES_PRISMA_URL || 
                process.env.PRISMA_DATABASE_URL || 
                process.env.POSTGRES_URL;
  
  if (dbUrl) {
    process.env.DATABASE_URL = dbUrl;
    console.log('[Database Setup] Set DATABASE_URL from:', 
      process.env.POSTGRES_PRISMA_URL ? 'POSTGRES_PRISMA_URL' :
      process.env.PRISMA_DATABASE_URL ? 'PRISMA_DATABASE_URL' :
      'POSTGRES_URL'
    );
  } else {
    console.error('[Database Setup] WARNING: No database URL found! Using dummy URL for build.');
    // Use a dummy URL just for the build to complete
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db?schema=public';
  }
} else {
  console.log('[Database Setup] DATABASE_URL already set');
}

// Verify Supabase configuration
console.log('\n[Database Setup] Checking Supabase configuration:');
const supabaseVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

Object.entries(supabaseVars).forEach(([key, value]) => {
  console.log(`  ${key}: ${value ? '✓ Set' : '✗ Not set'}`);
});

console.log('\n[Database Setup] Configuration complete');