# V3RA - Truth Refinement Platform

V3RA is a minimalist truth refinement platform where users can spend tokens to get multi-AI answers (Ask mode) or earn tokens by selecting the best answers (Refine mode).

## Core Features

- **Ask Mode**: Spend tokens to query multiple AI models with 3 simple presets (Fast 2 tokens, Balanced 5 tokens, Maximum 10 tokens)
- **Refine Mode**: Earn tokens by selecting the best answers through an intuitive swipe interface
- **Token Economy**: Start with 50 tokens, earn more through refinement
- **Minimalist UI**: Clean, focused interface inspired by iPod simplicity

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we recommend Supabase)
- Environment variables (see `.env.example`)

### Local Development

1. Clone the repository and install dependencies:
```bash
git clone https://github.com/yourusername/v3ra.git
cd v3ra
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- LLM API keys (OpenAI, Anthropic, etc.)

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy your database URL and add to `.env.local`
4. Enable Row Level Security (RLS) on all tables
5. Run migrations: `npx prisma db push`

## Deployment

### Vercel (Recommended)

1. Fork this repository
2. Import to Vercel: [vercel.com/import](https://vercel.com/import)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

Build the production bundle:
```bash
npm run build
npm start
```

## Architecture

- **Frontend**: Next.js 15 with TypeScript
- **State Management**: Zustand for client state
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom design tokens
- **LLM Integration**: Multiple providers (OpenAI, Anthropic, etc.)

## Token Economy

Users start with 50 tokens. Tokens are spent in Ask mode and earned in Refine mode:

- **Fast (2 tokens)**: Quick answers from 2 models
- **Balanced (5 tokens)**: Default mix of 4 models  
- **Maximum (10 tokens)**: Complex queries with 6+ models
- **Refine earnings**: 1-3 tokens per quality selection

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npx prisma studio` - Open Prisma Studio for database management

### Project Structure

```
/app              - Next.js app router pages
/components       - React components
  /ask           - Ask mode components
  /refine        - Refine mode components
  /ui            - Shared UI components
/lib             - Utility functions and configurations
/store           - Zustand state stores
/prisma          - Database schema
/public          - Static assets
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and ensure builds pass
4. Submit a pull request

## License

MIT License - see LICENSE file for details