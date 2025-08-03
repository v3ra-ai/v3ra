#!/usr/bin/env node

/**
 * Run database migrations during deployment
 * This ensures the database schema matches the deployed code
 */

const { execSync } = require('child_process');

console.log('🚀 Starting deployment migrations...');

try {
  // Check if we're in production
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    console.log('📦 Running production migrations...');
    
    // Run migrations
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        // Ensure we use the production database URL
        DATABASE_URL: process.env.DATABASE_URL
      }
    });
    
    console.log('✅ Migrations completed successfully');
  } else {
    console.log('⏭️  Skipping migrations (not in production)');
  }
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  
  // In production, we should fail the build if migrations fail
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    process.exit(1);
  }
}