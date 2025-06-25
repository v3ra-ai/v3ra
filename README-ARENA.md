# V3RA Truth Arena - Minimal MVP

## What This Is
A radically simple "Proof of Human Work" arena where users evaluate AI responses to discover truth through human consensus.

## Current State
- Single page application (<200 lines)
- Daily rotating questions
- 60-second timer for evaluation
- Points stored in localStorage
- Mock consensus results

## How It Works
1. Visit the site daily
2. Read the question
3. Evaluate 5 anonymous AI responses
4. Pick the best answer within 60 seconds
5. Earn 1 point for participation
6. See how others voted

## Tech Stack
- Next.js 15
- TypeScript
- Tailwind CSS
- No database (yet)
- No authentication (yet)
- No blockchain (yet)

## Run Locally
```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Philosophy
"The best code is no code" - We deleted 80% of the original codebase to achieve radical simplicity.

## Next Steps
1. Add real consensus tracking
2. Implement wallet connection
3. Deploy token contract
4. Store results on-chain