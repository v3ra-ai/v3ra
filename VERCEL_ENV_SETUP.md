# Vercel Environment Variables Setup

## Required Environment Variables

Based on your `.env` file, you need ALL of these in Vercel:

### Database URLs (CRITICAL - These are likely the issue)
```bash
# Main connection URL for the app (pooled)
DATABASE_URL=postgresql://postgres.rccfhomdmfbcywrlvgly:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct connection for migrations (non-pooled)
POSTGRES_URL_NON_POOLING=postgresql://postgres:[YOUR-PASSWORD]@db.rccfhomdmfbcywrlvgly.supabase.co:5432/postgres
```

### API Keys (CRITICAL for blind test to work)
```bash
OPENROUTER_API_KEY=[YOUR-OPENROUTER-KEY]
OPENAI_API_KEY=[YOUR-OPENAI-KEY]
ANTHROPIC_API_KEY=[YOUR-ANTHROPIC-KEY]
GEMINI_API_KEY=[YOUR-GEMINI-KEY]
```

### Supabase Keys
```bash
NEXT_PUBLIC_SUPABASE_URL=https://rccfhomdmfbcywrlvgly.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjY2Zob21kbWZiY3l3cmx2Z2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjkwNTcsImV4cCI6MjA2NjA0NTA1N30.qv249Pf8wBboAoEFDyYRpO4WfdhvmJ9ia8NuAPpztA0
SUPABASE_URL=https://rccfhomdmfbcywrlvgly.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjY2Zob21kbWZiY3l3cmx2Z2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NjkwNTcsImV4cCI6MjA2NjA0NTA1N30.qv249Pf8wBboAoEFDyYRpO4WfdhvmJ9ia8NuAPpztA0
```

### Other Important Variables
```bash
NEXT_PUBLIC_SITE_URL=https://www.v3ra.ai
ENCRYPTION_KEY=[YOUR-32-CHAR-HEX-KEY]
ENCRYPTION_IV=[YOUR-16-CHAR-HEX-IV]
```

## Common Issues

1. **Wrong Database URL Format**
   - The pooler URL MUST use port 6543
   - The direct URL MUST use port 5432
   - Don't mix these up!

2. **Missing API Keys**
   - Without OPENROUTER_API_KEY, the validators can't initialize
   - This causes 500 errors before reaching the model selection

3. **Incorrect Variable Names**
   - Use `DATABASE_URL` not `POSTGRES_PRISMA_URL`
   - Use `POSTGRES_URL_NON_POOLING` not `DIRECT_URL`

## How to Add to Vercel

1. Go to: https://vercel.com/[your-project]/settings/environment-variables
2. Click "Add New"
3. Add each variable with its value
4. Make sure to select all environments (Production, Preview, Development)
5. Save and redeploy

## Test After Deployment

Visit: https://www.v3ra.ai/api/test/db-connection

Should return:
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