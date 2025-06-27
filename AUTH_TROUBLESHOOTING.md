# Authentication Troubleshooting Guide

## Current Setup
The application uses **Supabase Authentication** - you don't need a third-party auth provider. However, there are several configuration steps needed to make it work properly.

## Required Environment Variables

### For Production (Vercel)
```bash
# These should be automatically provided by Vercel's Supabase integration
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database URLs (provided by Supabase integration)
DATABASE_URL=your-database-url
POSTGRES_PRISMA_URL=your-pooled-database-url
POSTGRES_URL_NON_POOLING=your-non-pooled-database-url

# Optional but recommended
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### For Local Development
```bash
# Add these to your .env.local file
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-database-url
```

## Common Issues and Solutions

### 1. "Authentication failed" or users can't sign up/login

**Check Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to Authentication > URL Configuration
3. Add your site URL to "Redirect URLs":
   - For production: `https://your-domain.com/auth/callback`
   - For local: `http://localhost:3000/auth/callback`

### 2. Email verification not working

**In Supabase Dashboard:**
1. Go to Authentication > Email Templates
2. Ensure the confirmation email template is enabled
3. Check that the redirect URL in the template matches your site

**For testing locally:**
1. Go to Authentication > Settings
2. Temporarily disable "Confirm email" to test without email verification

### 3. Database user creation failing

**Check Prisma schema:**
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Check database connection
npx prisma db pull
```

### 4. Environment variables not loading

**On Vercel:**
1. Go to Project Settings > Environment Variables
2. Ensure all required variables are set
3. Redeploy after adding/changing variables

**Locally:**
1. Create `.env.local` file (not `.env`)
2. Restart the development server after changes

## Quick Fixes Applied

1. ✅ Fixed hardcoded redirect URL in signup flow to use `getAuthCallbackURL()`
2. ✅ Added proper TypeScript types
3. ✅ Fixed build errors

## Testing Authentication

### 1. Test Signup Flow:
```bash
# Start dev server
npm run dev

# Navigate to /signup
# Try creating a new account
# Check browser console for errors
```

### 2. Check Supabase Logs:
- Go to Supabase Dashboard > Logs > Auth
- Look for failed authentication attempts

### 3. Test Email Service:
- In Supabase Dashboard > Authentication > Settings
- Send a test email to verify SMTP is working

## Using Supabase Auth (No Third Party Needed)

Supabase provides:
- ✅ Email/Password authentication
- ✅ Magic link authentication
- ✅ Social OAuth providers (Google, GitHub, etc.)
- ✅ Email verification
- ✅ Password reset flow

To add social auth providers:
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable desired providers (Google, GitHub, etc.)
3. Add OAuth credentials from each provider
4. Update your login page to include social login buttons

## Debug Mode

To enable detailed logging, check the browser console. The auth flow includes extensive console.log statements in:
- `/app/auth/callback/page.tsx` - Auth callback handler
- `/app/signup/signup-client.tsx` - Signup flow
- `/app/login/login-client.tsx` - Login flow

## Need More Help?

1. Check Supabase Auth documentation: https://supabase.com/docs/guides/auth
2. Review the auth callback logs in browser console
3. Verify all environment variables are set correctly
4. Ensure your Supabase project has email auth enabled