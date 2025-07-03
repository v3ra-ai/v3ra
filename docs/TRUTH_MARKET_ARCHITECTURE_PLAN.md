# Truth Market Architecture Plan
*Created: June 30, 2025*

## Executive Summary
Transform the current multi-category consensus system into a unified **Truth Market** where every query becomes a probability assessment. This document outlines the architectural changes needed to achieve the vision of "AIs as traders in a prediction market for truth."

## Current State Analysis

### What We Have
- **6 query categories** with complex routing logic
- **Multiple response formats** and parsers
- **Category-specific UI components**
- **Excellent UI/UX** with premium dark theme
- **Robust prediction tracking system** (recently added)
- **Multi-AI consensus mechanism**
- **Credit system** for API usage

### What Works Well (Keep)
1. **UI/UX Design**
   - Dark cyberpunk theme with neon accents
   - Glass morphism effects
   - Smooth animations and transitions
   - Card-based layouts
   - AI Hub interface for model selection

2. **Core Infrastructure**
   - Validator system for managing AI models
   - Database schema (with modifications)
   - Authentication via Supabase
   - Credit management system
   - API key management

3. **Prediction System**
   - Recently added prediction tracking
   - Model performance tracking
   - Resolution mechanism
   - Historical accuracy data

## Architectural Refactor Plan

### Phase 1: Core Simplification (Week 1-2)

#### 1.1 Unified Query Processing
**Remove:**
- `QueryClassifier` class and all category detection logic
- 6 different prompt templates
- Category-specific response parsers
- `AdaptiveResponseProcessor` complexity

**Replace with:**
```typescript
interface TruthMarketQuery {
  statement: string;  // Any question converted to a verifiable statement
  context?: string;   // Optional additional context
  timeframe?: Date;   // When this should be evaluated (for predictions)
}

interface TruthMarketResponse {
  position: 'YES' | 'NO' | 'UNCERTAIN';
  confidence: number; // 0-100
  reasoning: string;
  modelName: string;
}
```

#### 1.2 Single Prompt Template
```typescript
const TRUTH_MARKET_PROMPT = `
You are a trader in a prediction market for truth. 
Given a statement, assess its probability of being true.

Statement: {statement}
Context: {context}

Respond with:
- Position: YES (likely true), NO (likely false), or UNCERTAIN
- Confidence: 0-100 representing your certainty
- Reasoning: Brief explanation of your assessment

Consider current evidence, future likelihood, and epistemic uncertainty.
`;
```

#### 1.3 Unified Consensus Mechanism
```typescript
function calculateMarketConsensus(responses: TruthMarketResponse[]): MarketResult {
  // Weight by confidence (AIs with higher confidence have more influence)
  // Track historical accuracy to adjust weights over time
  // Return single probability 0-100%
}
```

### Phase 2: Database Schema Updates (Week 2)

#### 2.1 Simplify VoteSession
```sql
-- Keep core fields, remove mode and category-specific fields
ALTER TABLE "VoteSession" 
  DROP COLUMN mode,
  ADD COLUMN statement TEXT, -- Normalized statement
  ADD COLUMN probability DECIMAL(5,2), -- Market consensus 0-100
  ADD COLUMN confidence DECIMAL(5,2); -- Average confidence
```

#### 2.2 Enhanced Validator Tracking
```sql
-- Add fields for "trader" performance
ALTER TABLE "Validator"
  ADD COLUMN calibration_score DECIMAL(5,4), -- How well calibrated their confidence is
  ADD COLUMN category_performance JSONB; -- Performance by topic type
```

#### 2.3 Unify with Prediction System
- Every VoteSession becomes a potential Prediction
- Track resolution for all queries where possible
- Build historical accuracy data

### Phase 3: UI Simplification (Week 3)

#### 3.1 Unified Results Display
**Remove:**
- `AdaptiveResultsDisplay` with 6 different layouts
- Category-specific cards
- Complex routing logic

**Create:**
- Single `TruthMarketResult` component
- Shows probability meter (0-100%)
- Displays consensus breakdown
- Links to prediction tracking if applicable

#### 3.2 Simplified Ask Page
```tsx
// Simplified query interface
<TruthMarketQuery>
  <QueryInput /> // Accept any question
  <StatementNormalizer /> // Convert to verifiable statement
  <ModelSelector /> // Keep existing AI Hub
  <SubmitButton />
</TruthMarketQuery>
```

#### 3.3 Results Page Design
```
┌─────────────────────────────────────┐
│ Statement: "AI will be conscious"   │
│                                     │
│ Truth Probability: ████████░░ 73%   │
│                                     │
│ Market Consensus:                   │
│ • 4 AIs say YES (avg 78% confident)│
│ • 1 AI says NO (65% confident)      │
│                                     │
│ [Track This Prediction]             │
└─────────────────────────────────────┘
```

### Phase 4: Truth Arena Integration (Week 4)

#### 4.1 Game Mechanics
```typescript
interface DailyChallenge {
  id: string;
  statement: string;
  aiConsensus: number; // Current market probability
  userPrediction?: number; // User's guess
  resolutionDate?: Date;
  resolved?: boolean;
  userScore?: number; // How close they were
}
```

#### 4.2 New Routes
- `/arena` - Daily truth challenge
- `/arena/history` - Past predictions and scores
- `/arena/leaderboard` - Top predictors

#### 4.3 Gamification Elements
- Daily streak tracking
- Accuracy badges
- Category expertise (auto-detected)
- Social sharing of victories

### Phase 5: Advanced Features (Week 5-6)

#### 5.1 Reputation System
```typescript
interface TraderReputation {
  validatorId: string;
  overallAccuracy: number;
  calibrationScore: number; // Are they overconfident?
  topicExpertise: Map<string, number>;
  recentPerformance: number[]; // Last 30 days
}
```

#### 5.2 Market Dynamics
- Time-weighted predictions (recent = more weight)
- Specialization bonuses (good at tech? Higher weight on tech)
- Uncertainty rewards (admitting uncertainty when appropriate)
- Contrarian bonuses (being right when consensus was wrong)

#### 5.3 Human Integration
- Humans can submit market signals
- Weight human "super-forecasters" into consensus
- Use human resolution votes as ground truth
- Create human vs AI leaderboards

## Implementation Priority

### Week 1: Core Refactor
1. Create new unified query processor
2. Implement single prompt template
3. Build new consensus calculator
4. Update API endpoints

### Week 2: Database Migration
1. Create migration scripts
2. Update Prisma schema
3. Preserve existing data
4. Add new tracking fields

### Week 3: UI Updates
1. Create TruthMarketResult component
2. Simplify Ask page
3. Update routing logic
4. Maintain design system

### Week 4: Truth Arena MVP
1. Daily challenge system
2. Basic scoring
3. History tracking
4. Simple leaderboard

### Week 5-6: Polish & Advanced Features
1. Reputation weighting
2. Market dynamics
3. Performance optimization
4. Testing and refinement

## What Gets Removed

### Code to Delete
- `/lib/ai/queryClassifier.ts`
- `/lib/ai/adaptive-response-processor.ts`
- Category-specific prompt templates
- Complex routing logic
- Category-specific UI components

### Simplified APIs
- `/api/broadcast-query` - Now just probability assessment
- `/api/validators/active` - Keep as is
- Remove category-specific endpoints

## Success Metrics

1. **Code Reduction**: Remove 60%+ of query processing code
2. **Performance**: Faster response times (no routing overhead)
3. **Accuracy**: Track prediction accuracy over time
4. **Engagement**: Daily active users in Truth Arena
5. **Calibration**: How well probabilities match reality

## Risk Mitigation

1. **Data Migration**: Create comprehensive backup before changes
2. **Gradual Rollout**: Feature flag for new vs old system
3. **User Communication**: Clear messaging about changes
4. **Fallback Plan**: Keep old code in separate branch

## Final Architecture

```
User Query → Statement Normalizer → Truth Market Engine → AI Traders
                                                           ↓
Human Arena ← Prediction Tracker ← Market Consensus ← Weighted Responses
```

Simple. Elegant. Powerful.

Every question becomes a bet on truth. Every AI becomes a trader. Every human becomes a market maker.

This is your Truth Market.