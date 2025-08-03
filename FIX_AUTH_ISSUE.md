# Fix Authentication Issue for Vote Submission

## The Problem
After logging in successfully, the vote submission fails with "Unauthorized" because the authentication session isn't being properly passed to the API routes.

## Quick Fix Steps

### 1. Clear Browser Data
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Click "Clear site data"
4. This removes any stale cookies

### 2. Restart Dev Server
```bash
npm run dev
```

### 3. Login Again
1. Go to http://localhost:3001/login
2. Login with your credentials
3. You should be redirected to /ask

### 4. Test Authentication
Visit: http://localhost:3001/api/test/auth-check

You should see:
```json
{
  "cookies": {
    "authRelated": [
      { "name": "sb-rccfhomdmfbcywrlvgly-auth-token", "hasValue": true }
    ]
  },
  "auth": {
    "user": {
      "id": "your-user-id",
      "email": "your-email"
    }
  }
}
```

### 5. Test Vote Submission
1. Submit a query on /ask
2. Click on one of the AI responses to vote
3. The scratch card should appear

## If Still Not Working

### Check Supabase Auth Settings
1. Go to Supabase Dashboard
2. Authentication > URL Configuration
3. Ensure these are set:
   - Site URL: `http://localhost:3001`
   - Redirect URLs include: `http://localhost:3001/auth/callback`

### Update Cookie Settings (if needed)
The issue might be related to cookie settings. We've already updated CSRF to use `sameSite: 'lax'`, but Supabase cookies might need adjustment.

### Debug in Browser Console
```javascript
// Check if you have a session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Check cookies
console.log('Cookies:', document.cookie);
```

## Root Cause
The issue is likely one of:
1. Supabase auth cookies not being set properly after login
2. Cookies being blocked by browser settings
3. Session not persisting between page navigation

## The Complete Working Flow
1. User logs in → Supabase sets auth cookies
2. User submits query → Works (no auth needed)
3. User votes → API checks auth via cookies → Awards points
4. Scratch card appears → Points update