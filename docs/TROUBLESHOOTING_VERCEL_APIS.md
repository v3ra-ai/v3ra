# Troubleshooting Validator and Vote History API Issues on Vercel

## Overview

This guide helps diagnose and fix issues with the validator and vote history API endpoints not loading properly on Vercel deployment.

## Common Issues and Solutions

### 1. Database Connection Issues

#### Symptoms:
- API endpoints return 500 errors
- Logs show database connection timeouts
- "No database URL found" errors

#### Solutions:

1. **Verify Environment Variables in Vercel:**
   ```bash
   # Required environment variables:
   DATABASE_URL or POSTGRES_PRISMA_URL
   POSTGRES_URL_NON_POOLING
   SUPABASE_URL
   SUPABASE_ANON_KEY
   ```

2. **Check Database URL Format:**
   - The database URL should use the pooled connection string for serverless
   - Format: `postgresql://[user]:[password]@[host]:[port]/[database]?pgbouncer=true&connection_limit=1`

3. **Verify Supabase Integration:**
   - If using Vercel's Supabase integration, ensure it's properly connected
   - The integration automatically provides the required environment variables

### 2. Prisma Client Issues

#### Symptoms:
- "Cannot find module '@prisma/client'" errors
- Schema validation errors
- Client generation failures

#### Solutions:

1. **Ensure Prisma Client is Generated:**
   ```json
   // package.json
   "build": "node scripts/setup-database-url.js && prisma generate && next build"
   ```

2. **Add postinstall Script:**
   ```json
   "postinstall": "prisma generate"
   ```

3. **Check Prisma Schema:**
   - Verify datasource configuration uses env("DATABASE_URL")
   - Ensure all required models are defined

### 3. API Route Timeout Issues

#### Symptoms:
- API calls timeout after 10-30 seconds
- Partial data returned
- Vercel function timeout errors

#### Solutions:

1. **Implement Query Timeouts:**
   ```typescript
   // Already implemented in lib/db/query-wrapper.ts
   export async function safeQuery<T>(
     queryFn: () => Promise<T>,
     fallback: T,
     timeoutMs: number = 8000
   ): Promise<T>
   ```

2. **Optimize Database Queries:**
   - Add proper indexes in Prisma schema
   - Use pagination for large datasets
   - Implement caching for frequently accessed data

### 4. Validator Registry Issues

#### Symptoms:
- Empty validator list
- "Failed to fetch validators" errors
- Inconsistent validator data

#### Solutions:

1. **Check Validator Cache:**
   - Cache is enabled by default (10 minutes TTL)
   - Can be disabled with `VALIDATOR_CACHE_ENABLED=false`
   - Adjust TTL with `VALIDATOR_CACHE_TTL=600` (seconds)

2. **Verify Validator Data:**
   ```bash
   npm run diagnose:vercel
   ```

### 5. Vote History Loading Issues

#### Symptoms:
- Vote history not showing
- Empty responses from /api/vote-history
- Pagination not working

#### Solutions:

1. **Check Vote Session Data:**
   - Ensure VoteSession records exist in database
   - Verify ValidatorResponse relationships are intact
   - Check for orphaned records

2. **Test API Endpoints:**
   ```bash
   # Test locally
   npm run test:api
   
   # Test production
   npm run test:api https://your-app.vercel.app
   ```

## Diagnostic Scripts

### 1. Database Diagnostics

Run the diagnostic script to check database connectivity and data integrity:

```bash
npm run diagnose:vercel
```

This script checks:
- Database connection
- Environment variables
- Table existence
- Validator data integrity
- Vote session data
- API endpoint responses (local only)

### 2. API Endpoint Testing

Test all API endpoints directly:

```bash
# Test local environment
npm run test:api

# Test production
npm run test:api https://your-app.vercel.app

# Test preview deployment
npm run test:api https://your-app-preview.vercel.app
```

## Vercel-Specific Considerations

### 1. Environment Variables

Vercel uses different environment variable names than local development:
- `VERCEL_URL` - The deployment URL (automatically set)
- `POSTGRES_PRISMA_URL` - Pooled database connection (from Supabase integration)
- `POSTGRES_URL_NON_POOLING` - Direct database connection

### 2. Build Process

The build process on Vercel:
1. Runs `scripts/setup-database-url.js` to map environment variables
2. Generates Prisma client with `prisma generate`
3. Builds Next.js application

### 3. Function Limits

Be aware of Vercel's function limits:
- Default timeout: 10 seconds (Hobby), 60 seconds (Pro)
- Memory: 1024 MB (Hobby), 3008 MB (Pro)
- Payload size: 4.5 MB

## Debugging Steps

1. **Check Vercel Function Logs:**
   ```
   Vercel Dashboard > Your Project > Functions > View Logs
   ```

2. **Enable Detailed Logging:**
   Add console.log statements in API routes to track execution

3. **Test Database Connection:**
   Create a simple test endpoint:
   ```typescript
   // app/api/test-db/route.ts
   import { prisma } from '@/lib/db/client';
   
   export async function GET() {
     try {
       const count = await prisma.validator.count();
       return Response.json({ success: true, validators: count });
     } catch (error) {
       return Response.json({ success: false, error: String(error) }, { status: 500 });
     }
   }
   ```

4. **Monitor Performance:**
   - Use Vercel Analytics to identify slow endpoints
   - Check database query performance in Supabase dashboard

## Common Fixes

1. **Rebuild and Redeploy:**
   ```bash
   vercel --force
   ```

2. **Clear Build Cache:**
   - In Vercel Dashboard: Settings > Advanced > Clear Cache

3. **Update Dependencies:**
   ```bash
   npm update @prisma/client prisma
   npm install
   ```

4. **Verify Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Supabase + Vercel Integration](https://supabase.com/docs/guides/integrations/vercel)