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

1. Push to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy

### Environment Variables

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
# ... other LLM keys
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License - see LICENSE file for details