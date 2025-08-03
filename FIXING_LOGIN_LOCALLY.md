# Fixing Login Locally

## The Issue
Login is failing because Supabase requires email confirmation, but we're testing locally.

## Quick Fix (For Local Testing)

### Option 1: Disable Email Confirmation in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers** > **Email**
3. Uncheck **"Confirm email"**
4. Save changes

### Option 2: Use Supabase's Built-in Confirmation Link
1. After signing up, check the Supabase Dashboard
2. Go to **Authentication** > **Users**
3. Find the test user (test@v3ra.ai)
4. Click on the user and manually confirm them

### Option 3: Create a Confirmed Test User via SQL
Run this in Supabase SQL Editor:
```sql
-- Update the test user to be confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'test@v3ra.ai';
```

## Testing After Fix

Once email confirmation is disabled or the user is confirmed:

1. Start the dev server: `npm run dev`
2. Go to http://localhost:3001/login
3. Login with:
   - Email: `test@v3ra.ai`
   - Password: `TestPassword123!`

## Production Considerations

For production, you should:
1. Keep email confirmation enabled
2. Set up SMTP in Supabase for sending confirmation emails
3. Configure proper email templates

## Current Status

- ✅ Supabase authentication is configured correctly
- ✅ User creation works
- ❌ Email confirmation is blocking login
- ✅ Database connection works
- ✅ All required environment variables are set locally