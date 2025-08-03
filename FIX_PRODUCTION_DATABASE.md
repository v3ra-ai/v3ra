# Fix Production Database Connection

The blind-test-query API works locally but fails in production because of environment variable configuration issues.

## Root Cause

1. **Database is properly set up** - The `ai_models` table and `get_blind_test_pair` function exist and work
2. **Issue is with Vercel environment variables** - The production environment cannot connect to the database

## Solution

### 1. Update Vercel Environment Variables

Go to your Vercel project settings: https://vercel.com/jeremys-projects-6f133213/v3ra/settings/environment-variables

Make sure these variables are set correctly:

```bash
# Use the direct connection URL (not pooler) for Prisma
DATABASE_URL=postgresql://postgres.rccfhomdmfbcywrlvgly:u6tTDMSBrSPX9ct7@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1

# Alternative: Use the direct connection
DIRECT_URL=postgresql://postgres:u6tTDMSBrSPX9ct7@db.rccfhomdmfbcywrlvgly.supabase.co:5432/postgres

# Ensure these are also set
NEXT_PUBLIC_SUPABASE_URL=https://rccfhomdmfbcywrlvgly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjY2Zob21kbWZiY3l3cmx2Z2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjkwNTcsImV4cCI6MjA2NjA0NTA1N30.qv249Pf8wBboAoEFDyYRpO4WfdhvmJ9ia8NuAPpztA0

# Add all your API keys from .env file
```

### 2. Update Prisma Schema for Production

Update `/prisma/schema.prisma` to use connection pooling properly:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 3. Disable RLS for Backend Access (Optional)

Since we're accessing from the backend with Prisma, we can disable RLS on the ai_models table:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE ai_models DISABLE ROW LEVEL SECURITY;
```

### 4. Test the Fix

After updating environment variables, redeploy and test:

1. Go to https://www.v3ra.ai/ask
2. Type any query
3. The blind test should now work without 500 errors

### 5. Alternative: Use Supabase Service Role Key

If the above doesn't work, add a service role key:

1. Go to Supabase Dashboard > Settings > API
2. Copy the `service_role` key (secret)
3. Add to Vercel: `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`

### Verification Script

Run this locally to verify your setup:

```bash
node scripts/test-model-registry.js
```

If it works locally but not on Vercel, it's definitely an environment variable issue.