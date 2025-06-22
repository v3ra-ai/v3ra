# v3ra Setup Guide

## Overview
This guide will walk you through setting up your own instance of the v3ra AI Consensus Network after forking from the original Verafy codebase.

## Prerequisites
- Node.js v18+ (v22.14.0 recommended)
- npm v9+
- Git
- Supabase account (free tier works)
- AI Provider API keys (at least one of: OpenAI, Anthropic, Google Gemini, HuggingFace, OpenRouter)
- Solana wallet address for payments (optional)

## Step 1: Database Setup (Supabase)

### Create New Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Save your database password securely
3. Once created, go to Settings > Database and note down:
   - Database URL (for Prisma)
   - Direct connection string (without pooling)
   - Connection string (with pooling)

### Configure Database URLs
In your `.env` file, update:
```env
# Use the pooled connection for general use
DATABASE_URL=postgresql://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Use direct connection for Prisma migrations
PRISMA_DATABASE_URL=postgresql://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Run Database Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run all migrations to create schema
npx prisma migrate deploy

# Optional: Seed with initial data
npx prisma db seed
```

## Step 2: Environment Configuration

### Generate Security Keys
```bash
# Generate encryption key (32 characters)
openssl rand -hex 16

# Generate encryption IV (16 characters)  
openssl rand -hex 8
```

### Create `.env` file
Copy `.envExample` to `.env` and update:
```env
# Database (from Supabase)
DATABASE_URL=your_pooled_connection_string
PRISMA_DATABASE_URL=your_direct_connection_string

# AI Provider Keys (add at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
HUGGING_FACE_API_KEY=hf_...
OPENROUTER_API_KEY=sk-or-...

# Security (use generated values)
ENCRYPTION_KEY=your_generated_32_char_key
ENCRYPTION_IV=your_generated_16_char_iv

# Payments (optional)
NEXT_PUBLIC_V3RA_WALLET_PUBLIC_KEY=your_solana_wallet_address
V3RA_WALLET_PUBLIC_KEY=your_solana_wallet_address
CURRENT_SOLANA_NETWORK=Devnet
```

## Step 3: Configure Validators

### Add API Keys in Database
1. Start the development server: `npm run dev`
2. Navigate to `/admin` (default login: admin/admin - CHANGE THIS!)
3. Go to "API Keys" section
4. Add your AI provider API keys
5. Go to "Validators" section
6. Activate the validators you want to use

### Important: Change Admin Credentials
Update `/app/admin/login/page.tsx` to use secure credentials or implement proper authentication.

## Step 4: Deployment Options

### Option A: Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts to link to your Vercel account
4. Add environment variables in Vercel dashboard
5. Deploy: `vercel --prod`

### Option B: Self-Hosted
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Use a process manager like PM2 for reliability
4. Set up reverse proxy (nginx/caddy) for SSL

## Step 5: Post-Setup Tasks

### 1. Update Branding
- Replace logo files in `/public` directory
- Update any remaining "Verafy" references to "v3ra"
- Customize color scheme in Tailwind config if desired

### 2. Configure Credits System
- Default: 10 free credits per day per user
- Modify in database or code as needed
- Set up Solana wallet for paid credits (optional)

### 3. Monitor Health
- Check `/admin/llm-health` for AI provider status
- Set up monitoring alerts for critical services
- Review logs for any errors

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase project is active
   - Check connection strings are correct
   - Ensure IP is whitelisted (if applicable)

2. **AI Provider Errors**
   - Verify API keys are correct and active
   - Check provider rate limits
   - Ensure validators are activated in admin panel

3. **Build Errors**
   - Run `npm install --legacy-peer-deps` if dependency conflicts
   - Clear `.next` folder and rebuild
   - Check Node.js version compatibility

### Getting Help
- Check logs in browser console and server output
- Review Supabase logs for database issues
- Contact support@v3ra.ai for assistance

## Security Recommendations

1. **Change Default Admin Credentials Immediately**
2. Generate new encryption keys (don't use examples)
3. Use environment variables for all secrets
4. Enable Supabase Row Level Security (RLS) when ready
5. Implement rate limiting for API endpoints
6. Regular security audits of dependencies

## Next Steps

1. Test the application thoroughly
2. Customize UI/UX to your needs
3. Add your own features and improvements
4. Set up monitoring and analytics
5. Plan your launch strategy

Welcome to the v3ra network! 🚀