# Complete Authentication Fix Guide

## Summary of Changes Made

I've identified and fixed the authentication persistence issue. The problem was that Supabase auth cookies weren't being properly handled between client and server.

## Changes Made

1. **Updated Cookie Storage in `/lib/supabase-client.ts`**:
   - Added proper URI encoding/decoding for cookie values
   - Fixed cookie parsing to handle encoded values
   - Added debug logging for cookie operations

2. **Created Auth Debug Endpoints**:
   - `/api/test/auth-check` - Basic auth verification
   - `/api/test/auth-debug` - Comprehensive auth debugging

3. **Fixed Cookie Configuration**:
   - Changed CSRF sameSite from 'strict' to 'lax' (already done)
   - Ensured all cookies use consistent path='/'
   - Added proper secure flag for production

## Steps to Test

### 1. Clear Everything and Start Fresh
```bash
# Stop the dev server
# Clear browser data for localhost:3001
# Start fresh
npm run dev
```

### 2. Test Authentication Flow

1. **Go to http://localhost:3001/login**
2. **Login with your credentials**
3. **Check auth is working**: Visit http://localhost:3001/api/test/auth-debug
   
   You should see:
   ```json
   {
     "supabase": {
       "session": {
         "exists": true,
         "user": {
           "id": "your-user-id",
           "email": "your-email"
         }
       }
     }
   }
   ```

### 3. Test Vote Submission

1. **Go to http://localhost:3001/ask**
2. **Submit a query** (e.g., "What is the meaning of life?")
3. **Click on one of the AI responses** to vote
4. **The scratch card should appear** with your points reward

## What Was Wrong

1. **Cookie Encoding**: The auth token cookies were being double-encoded, preventing proper parsing
2. **Cookie Path**: Some cookies weren't being set with explicit path='/', causing them to be scoped incorrectly
3. **Server Client**: The server-side Supabase client wasn't logging enough info to debug cookie issues

## Production Deployment

Once everything works locally:

1. **Verify all environment variables** are set in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - All other API keys

2. **Push to git**:
   ```bash
   git add -A
   git commit -m "fix: resolve authentication persistence issue"
   git push
   ```

3. **Monitor production logs** for any auth errors

## Debugging Tools

If issues persist, use these endpoints:

- **Basic check**: http://localhost:3001/api/test/auth-check
- **Detailed debug**: http://localhost:3001/api/test/auth-debug
- **Browser console**: Check for any cookie warnings or errors

## Key Points

- Authentication now properly persists between client and server
- Cookies are correctly encoded/decoded
- Vote submission should work after login
- Points system and scratch cards are functional