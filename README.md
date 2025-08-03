# v3ra Minimal Ask

A lightweight, production-ready multi-LLM query interface.

## Overview

v3ra Minimal Ask allows users to query multiple AI models simultaneously and view consensus results. This stripped-down version focuses on core functionality with minimal complexity.

## Features

- 🤖 Query multiple LLMs with a single question
- 📊 View AI consensus and individual responses
- 📜 Vote history with result cards
- 🌓 Dark/Light theme support
- 💳 Solana wallet integration
- 🚀 Production-ready and performant

## Quick Start

### Prerequisites

- **Node.js**: v18+ (v22.14.0 recommended)
- **npm**: v9+ (bundled with Node.js)
- **Git**: For cloning the repo
- **Supabase account**: For database and authentication

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/v3ra-ai/v3ra.git
cd v3ra
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

4. **Configure your `.env` file** with:
- Supabase URL and keys
- LLM API keys (OpenAI, Anthropic, etc.)
- Solana RPC endpoint

5. **Run the development server**:
```bash
npm run dev
```

6. **Open your browser** to `http://localhost:3000`

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── ask/             # Main Ask interface
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── components/          # React components
│   └── ask/            # Ask-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
└── store/              # State management
```

## Key Components

- **Ask Interface**: Main query interface at `/ask`
- **LLM Selection**: Choose which AI models to query
- **Vote History**: View past queries and consensus results
- **Theme Toggle**: Switch between light and dark modes

## API Routes

- `/api/broadcast-query` - Submit queries to multiple LLMs
- `/api/vote-history` - Retrieve voting history
- `/api/validators` - Manage LLM validators

## Configuration

### Supported LLMs

Configure available LLMs in your environment:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Mistral
- And more...

### Database Schema

The app uses Supabase with PostgreSQL. Key tables:
- `vote_sessions` - Stores query sessions
- `votes` - Individual LLM responses
- `validators` - LLM configurations

## Deployment

### Vercel Deployment

1. **Push to GitHub**:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Connect repository to Vercel**:
   - Import project in Vercel dashboard
   - Select the repository
   - Configure build settings (auto-detected)

3. **Configure environment variables**:
   - Add all required env vars in Vercel dashboard
   - Ensure DATABASE_URL uses pooled connection
   - Set NODE_ENV=production

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Verify deployment at provided URL

### Database Migrations

1. **Apply migrations locally**:
```bash
npx prisma migrate dev
```

2. **Apply migrations in production**:
```bash
npx prisma migrate deploy
```

3. **Check migration status**:
```bash
npx prisma migrate status
```

### Post-Deployment Checklist

- [ ] Verify all API endpoints are accessible
- [ ] Test authentication flow
- [ ] Check rate limiting is working
- [ ] Verify CSRF protection is active
- [ ] Test LLM queries are functioning
- [ ] Monitor error logs in Sentry

### Environment Variables

Complete list of required and optional environment variables:

#### Database & Auth (Required)
```env
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database URLs (auto-configured by Supabase)
DATABASE_URL=your-pooled-connection-url
POSTGRES_URL_NON_POOLING=your-direct-connection-url
```

#### LLM API Keys (At least one required)
```env
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google
GOOGLE_API_KEY=...

# Mistral
MISTRAL_API_KEY=...

# Groq
GROQ_API_KEY=...

# OpenRouter (for additional models)
OPENROUTER_API_KEY=sk-or-...
```

#### Monitoring & Analytics (Optional)
```env
# Sentry error tracking
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Hotjar
NEXT_PUBLIC_HOTJAR_SITE_ID=...
NEXT_PUBLIC_HOTJAR_VERSION=6
```

#### Security (Auto-generated if not set)
```env
# CSRF Protection
CSRF_SECRET=32-character-random-string
```

#### Application Settings (Optional)
```env
# Node environment
NODE_ENV=production

# Application version
NEXT_PUBLIC_APP_VERSION=1.0.0

# Logging level
LOG_LEVEL=info
```

#### Rate Limiting (Optional)
```env
# Redis URL for distributed rate limiting
REDIS_URL=redis://...
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License - see LICENSE file for details