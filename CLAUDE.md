# CLAUDE.md - V3RA Truth Arena Project

## Project Vision
Building a minimalist "Proof of Human Work" arena where users evaluate AI responses to discover truth through human consensus. Think Wordle meets AI evaluation meets blockchain.

## Core Philosophy & Principles

### Design Philosophy
- **Steve Jobs Approach**: "Simplicity is the ultimate sophistication"
- **Jack Dorsey Minimalism**: "Do one thing. Do it well. Stop doing it when it's done."
- **First Principles Thinking**: Start from the core problem, not existing solutions
- **Austrian Economics**: Free market principles, spontaneous order through human action
- **Libertarian Values**: Decentralized, permissionless, voluntary participation

### Development Guidelines
1. **Radical Simplicity**: Every line of code must be essential
2. **Delete First**: Before adding, try removing
3. **One File Rule**: If it can fit in one file, it should
4. **User First**: Beautiful, intuitive, immediate value
5. **Open Data**: Information wants to be free

## Product Definition

### The Arena (Main Product)
- Daily yes/no questions
- 5-7 anonymous AI responses
- Users pick the best answer
- Earn tokens for participation
- Track which LLMs humans prefer
- Store consensus on-chain

### Token Economics
- **Token = Proof of Human Work**
- Represents contribution to collective intelligence
- Governance rights over questions
- Reputation in the network
- NOT a payment token

## Technical Architecture (Target State)

```
testnet-demo/
├── app/
│   ├── page.tsx          (entire arena - <500 lines)
│   └── api/
│       └── query.ts      (single endpoint)
├── lib/
│   ├── validators.ts     (50 lines max)
│   └── db.ts            (Prisma client)
└── components/
    └── ui/              (5 basic components)
```

### Database Schema (4 tables only)
```sql
users (id, wallet_address, created_at)
queries (id, question, consensus, created_at)
votes (id, query_id, user_id, selected_answer, earned_points)
validators (id, name, provider, model, active)
```

## Implementation Strategy

### Phase 1: Slash & Burn (Current)
- Delete 80% of existing codebase
- Keep only essential UI components
- Remove all complex state management
- Simplify to single-page app

### Phase 2: MVP Arena
- One question per day
- Simple voting mechanism
- Points in localStorage
- No blockchain yet

### Phase 3: Token Integration
- Simple ERC-20 on Solana
- Wallet connection
- Daily claims

### Phase 4: On-Chain Truth
- Store consensus results
- IPFS + blockchain hash
- Public good dataset

## Current Status

### What We Have
- Over-engineered codebase from fork
- Good UI components to salvage
- Working database connection
- Basic authentication

### What We're Building
- Radical simplification of existing code
- Arena-first approach
- Focus on human evaluation loop
- Token as reputation, not payment

## The Jack Dorsey Test
For every feature/line of code ask:
1. Does this directly help evaluate AI responses?
2. Would the app break without it?
3. Can I explain it in one sentence?

If any answer is "no", delete it.

## Key Decisions Made

1. **Free + Earn Model**: No payments, only rewards
2. **One Question Per Day**: Scarcity drives engagement
3. **Blind Evaluation**: Users don't know which AI they're evaluating
4. **Open Data**: All results public, value is in the network
5. **Proof of Human Work**: New primitive for human-AI collaboration

## Tomorrow's Focus

1. Create new branch for fresh start
2. Build minimal arena page
3. Implement daily question logic
4. Add simple voting with localStorage
5. Deploy MVP for testing

## Mantras

- "The best code is no code"
- "Make it so simple there's nothing left to remove"
- "Does this help find truth through human consensus?"
- "Would Steve Jobs ship this?"
- "Is this Austrian economics approved?" (voluntary, decentralized, market-driven)