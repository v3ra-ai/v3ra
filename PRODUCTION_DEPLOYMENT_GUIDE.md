# Production Deployment Guide for V3RA.ai

## Current Status

All code fixes have been applied. The remaining issues are environment configuration in Vercel.

## Required Environment Variables for Vercel

### 1. Database URLs (CRITICAL)
```bash
# Main connection URL (pooled) - MUST use port 6543
DATABASE_URL=postgresql://postgres.rccfhomdmfbcywrlvgly:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection for migrations (non-pooled) - MUST use port 5432
POSTGRES_URL_NON_POOLING=postgresql://postgres:[YOUR-PASSWORD]@db.rccfhomdmfbcywrlvgly.supabase.co:5432/postgres
```

### 2. API Keys (Required for validators to work)
```bash
OPENROUTER_API_KEY=[YOUR-OPENROUTER-KEY]
OPENAI_API_KEY=[YOUR-OPENAI-KEY]
ANTHROPIC_API_KEY=[YOUR-ANTHROPIC-KEY]
GEMINI_API_KEY=[YOUR-GEMINI-KEY]
```

### 3. Supabase Keys
```bash
NEXT_PUBLIC_SUPABASE_URL=https://rccfhomdmfbcywrlvgly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjY2Zob21kbWZiY3l3cmx2Z2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjkwNTcsImV4cCI6MjA2NjA0NTA1N30.qv249Pf8wBboAoEFDyYRpO4WfdhvmJ9ia8NuAPpztA0
SUPABASE_URL=https://rccfhomdmfbcywrlvgly.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjY2Zob21kbWZiY3l3cmx2Z2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjkwNTcsImV4cCI6MjA2NjA0NTA1N30.qv249Pf8wBboAoEFDyYRpO4WfdhvmJ9ia8NuAPpztA0
```

### 4. Other Required Variables
```bash
NEXT_PUBLIC_SITE_URL=https://www.v3ra.ai
ENCRYPTION_KEY=[YOUR-32-CHAR-HEX-KEY]
ENCRYPTION_IV=[YOUR-16-CHAR-HEX-IV]
```

## How to Add to Vercel

1. Go to: https://vercel.com/[your-project]/settings/environment-variables
2. Click "Add New"
3. Add each variable with its value
4. **IMPORTANT**: Select all environments (Production, Preview, Development)
5. Save and redeploy

## Fixed Issues in Code

✅ CSP headers now allow Vercel Live domains
✅ CSRF token endpoint handles Vercel deployment URLs
✅ Database connection doesn't duplicate query parameters
✅ Rate limiting properly extracts IPs from Vercel headers
✅ Fallback models when database is unavailable
✅ Model registry handles database connection failures gracefully

## Testing After Deployment

### 1. Test Database Connection
Visit: https://www.v3ra.ai/api/test/db-connection

Expected response:
```json
{
  "success": true,
  "database": {
    "connected": true,
    "ai_models_table_exists": true,
    "model_count": 13,
    "get_blind_test_pair_works": true
  }
}
```

### 2. Test Blind Query
Visit: https://www.v3ra.ai/ask
- Type any query
- Should work without 500 errors

### 3. Check Console
Should NOT see:
- CSP frame blocking errors for Vercel Live
- 429 rate limit errors (unless actually rate limited)
- 500 errors on blind-test-query endpoint

## Common Issues

1. **Wrong Port Numbers**
   - Pooled connection MUST use port 6543
   - Direct connection MUST use port 5432

2. **Missing API Keys**
   - Without OPENROUTER_API_KEY, validators can't initialize
   - This causes 500 errors before reaching model selection

3. **Database URL Format**
   - Must include `?pgbouncer=true` for pooled connections
   - Don't add extra parameters that are already in the URL

## Emergency Fallbacks

The code includes fallbacks:
- Static model pairs if database fails
- Default CSP if configuration fails
- In-memory rate limiting if Redis unavailable

## Next Steps

1. Add all environment variables to Vercel
2. Redeploy the application
3. Run the tests above to verify everything works