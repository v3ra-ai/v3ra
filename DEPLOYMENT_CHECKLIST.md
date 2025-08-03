# Deployment Checklist for V3RA

## ✅ Local Testing Complete
- [x] Login/authentication working
- [x] Blind test queries working with dynamic models
- [x] Vote submission working
- [x] Scratch card appearing with points rewards
- [x] Points system integration complete

## 📋 Next Steps for Production Deployment

### 1. Transfer Environment Variables to Vercel
Copy ALL these values from your working `.env` file to Vercel:

#### Database URLs (CRITICAL - Check ports!)
- [ ] `DATABASE_URL` - Must use port 6543 (pooled)
- [ ] `POSTGRES_URL_NON_POOLING` - Must use port 5432 (direct)

#### API Keys (Required for AI models)
- [ ] `OPENROUTER_API_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `GEMINI_API_KEY`

#### Supabase Configuration
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`

#### Other Required
- [ ] `NEXT_PUBLIC_SITE_URL` (set to https://www.v3ra.ai)
- [ ] `ENCRYPTION_KEY`
- [ ] `ENCRYPTION_IV`

### 2. Deploy to Vercel
```bash
# Option 1: Deploy to preview branch
git push origin backup/work-in-progress-20250728-212511

# Option 2: Merge to main (after testing preview)
git checkout main
git merge backup/work-in-progress-20250728-212511
git push origin main
```

### 3. Test Production Deployment
1. [ ] Visit https://www.v3ra.ai/login
2. [ ] Login with credentials
3. [ ] Submit a query at /ask
4. [ ] Vote on AI responses
5. [ ] Verify scratch card appears
6. [ ] Check points update

### 4. Monitor for Issues
- Check Vercel logs for any errors
- Monitor the `/api/test/auth-debug` endpoint
- Watch for 429 rate limit errors
- Verify CSP headers aren't blocking anything

### 5. Clean Up (After Successful Deployment)
- [ ] Remove test endpoints (`/api/test/*`)
- [ ] Remove debug documentation files
- [ ] Clean up test scripts in `/scripts`

## 🚨 Common Issues to Watch For

1. **Auth not working**: Check Supabase URL and keys match exactly
2. **Models not loading**: Verify all API keys are set correctly
3. **Database errors**: Ensure DATABASE_URL uses port 6543
4. **CSRF errors**: Clear cookies and try again

## 📝 Rollback Plan
If issues occur:
```bash
# Revert to previous working commit
git revert HEAD
git push origin main
```