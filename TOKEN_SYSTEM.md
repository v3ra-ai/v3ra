# V3RA Token System

## Overview

V3RA uses a token-based economy where users spend tokens to get AI answers and earn tokens by refining truth through quality selection.

## Token Mechanics

### Starting Balance
- New users receive **50 tokens** upon registration
- Tokens are stored locally (localStorage for MVP)

### Spending Tokens (Ask Mode)
Users spend tokens to query multiple AI models:
- **Fast**: 2 tokens (2 models)
- **Balanced**: 5 tokens (4 models)
- **Maximum**: 10 tokens (6+ models)

### Earning Tokens (Refine Mode)
Users earn tokens by selecting the best AI responses:
- Quality selections earn 1-3 tokens based on alignment with community consensus
- Consistent quality curation builds reputation

## Implementation

### Token Store (Zustand)
Located at `/store/token-store.ts`

```typescript
interface TokenState {
  tokens: number;
  earnedThisSession: number;
  spentThisSession: number;
  canSpend: (amount: number) => boolean;
  spend: (amount: number) => boolean;
  earn: (amount: number) => void;
  reset: () => void;
}
```

### Storage
- MVP uses localStorage for persistence
- Future versions will integrate with database/blockchain

### Security Considerations
- Client-side validation for immediate UX feedback
- Server-side validation for actual token transactions (future)
- Rate limiting on earn actions to prevent abuse

## Future Enhancements

1. **Daily Bonus**: Users could receive daily tokens for engagement
2. **Achievements**: Bonus tokens for quality curation milestones
3. **Leaderboards**: Top refiners earn bonus tokens
4. **Token Purchase**: Option to buy tokens (not implemented in MVP)

## API Integration

Token operations are currently client-side only. Future API endpoints:
- `POST /api/tokens/spend` - Deduct tokens for queries
- `POST /api/tokens/earn` - Award tokens for refinement
- `GET /api/tokens/balance` - Get user's token balance