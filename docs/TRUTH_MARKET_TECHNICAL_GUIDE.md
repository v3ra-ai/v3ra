# Truth Market Technical Implementation Guide

## Quick Start: Day 1 Changes

### 1. Create New Truth Market Core

**File: `/lib/truth-market/core.ts`**
```typescript
export interface TruthStatement {
  id: string;
  originalQuery: string;
  statement: string; // Normalized to verifiable claim
  context?: string;
  timeframe?: Date; // For predictions
  createdAt: Date;
}

export interface MarketPosition {
  validatorId: string;
  modelName: string;
  position: 'YES' | 'NO' | 'UNCERTAIN';
  confidence: number; // 0-100
  reasoning: string;
  responseTime: number;
}

export interface MarketConsensus {
  statementId: string;
  probability: number; // 0-100
  confidence: number; // Average confidence
  positions: MarketPosition[];
  totalValidators: number;
  consensusStrength: 'STRONG' | 'MODERATE' | 'WEAK';
  lastUpdated: Date;
}
```

### 2. Replace Query Classification

**Delete these files:**
- `/lib/ai/queryClassifier.ts`
- `/lib/ai/adaptive-response-processor.ts`
- `/lib/ai/prompts/` (entire directory)

**Create: `/lib/truth-market/statement-normalizer.ts`**
```typescript
export class StatementNormalizer {
  // Convert any query to a verifiable statement
  static normalize(query: string): TruthStatement {
    // "Will AI be conscious?" → "AI will achieve consciousness"
    // "Is climate change real?" → "Climate change is real"
    // "Who will win 2025 election?" → "X will win 2025 election"
  }
}
```

### 3. Unified Validator Prompt

**Create: `/lib/truth-market/market-prompt.ts`**
```typescript
export const MARKET_SYSTEM_PROMPT = `You are an AI trader in a prediction market for truth.
Your role is to assess the probability that a given statement is or will be true.

Guidelines:
- Provide a clear YES/NO/UNCERTAIN position
- Give confidence 0-100 (0=completely unsure, 100=absolutely certain)
- Higher confidence means your vote has more weight
- Consider current evidence and future likelihood
- Be well-calibrated: 80% confidence should mean you're right 80% of the time`;

export function createMarketPrompt(statement: TruthStatement): string {
  return `Assess this statement: "${statement.statement}"
${statement.context ? `Context: ${statement.context}` : ''}
${statement.timeframe ? `Timeframe: ${statement.timeframe.toISOString()}` : ''}

Respond in JSON:
{
  "position": "YES" | "NO" | "UNCERTAIN",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`;
}
```

### 4. New Consensus Calculator

**Create: `/lib/truth-market/consensus-engine.ts`**
```typescript
export class ConsensusEngine {
  static calculate(positions: MarketPosition[]): MarketConsensus {
    // Core algorithm:
    // 1. Weight each position by confidence
    // 2. YES = 1, NO = 0, UNCERTAIN = 0.5
    // 3. Calculate weighted average
    // 4. Apply reputation weights (Phase 2)
    
    const weightedSum = positions.reduce((sum, pos) => {
      const value = pos.position === 'YES' ? 1 : 
                   pos.position === 'NO' ? 0 : 0.5;
      return sum + (value * pos.confidence);
    }, 0);
    
    const totalWeight = positions.reduce((sum, pos) => 
      sum + pos.confidence, 0);
    
    const probability = Math.round((weightedSum / totalWeight) * 100);
    
    return {
      probability,
      confidence: Math.round(totalWeight / positions.length),
      consensusStrength: getConsensusStrength(positions),
      // ... other fields
    };
  }
}
```

### 5. Update API Endpoint

**Modify: `/app/api/broadcast-query/route.ts`**
```typescript
export async function POST(request: Request) {
  const { query, llmIds } = await request.json();
  
  // 1. Normalize to statement
  const statement = StatementNormalizer.normalize(query);
  
  // 2. Get validators
  const validators = await getValidators(llmIds);
  
  // 3. Query each validator with unified prompt
  const positions = await Promise.all(
    validators.map(v => queryValidator(v, statement))
  );
  
  // 4. Calculate consensus
  const consensus = ConsensusEngine.calculate(positions);
  
  // 5. Save to database
  const session = await saveTruthMarketSession(statement, consensus);
  
  return NextResponse.json({ session, consensus });
}
```

### 6. Simplified UI Component

**Create: `/components/truth-market/truth-result.tsx`**
```tsx
export function TruthResult({ consensus }: { consensus: MarketConsensus }) {
  return (
    <Card className="truth-market-result">
      {/* Probability Meter */}
      <div className="probability-meter">
        <div className="meter-fill" style={{ width: `${consensus.probability}%` }}>
          <span className="percentage">{consensus.probability}%</span>
        </div>
      </div>
      
      {/* Consensus Breakdown */}
      <div className="consensus-details">
        <h3>Market Positions</h3>
        {consensus.positions.map(pos => (
          <div key={pos.validatorId} className="position">
            <span className={`stance ${pos.position.toLowerCase()}`}>
              {pos.position}
            </span>
            <span className="confidence">{pos.confidence}% confident</span>
            <span className="model">{pos.modelName}</span>
          </div>
        ))}
      </div>
      
      {/* Track Prediction Button */}
      {consensus.statement.timeframe && (
        <Button onClick={() => trackPrediction(consensus)}>
          Track This Prediction
        </Button>
      )}
    </Card>
  );
}
```

## Database Migration Scripts

### 1. Add Truth Market Fields
```sql
-- Add to VoteSession
ALTER TABLE "VoteSession" 
ADD COLUMN "statement" TEXT,
ADD COLUMN "probability" DECIMAL(5,2),
ADD COLUMN "averageConfidence" DECIMAL(5,2),
ADD COLUMN "consensusStrength" VARCHAR(20);

-- Add to Validator
ALTER TABLE "Validator"
ADD COLUMN "calibrationScore" DECIMAL(5,4) DEFAULT 0.5,
ADD COLUMN "marketPerformance" JSONB DEFAULT '{}';

-- Create new table for tracking
CREATE TABLE "MarketPosition" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT REFERENCES "VoteSession"(id),
  "validatorId" TEXT REFERENCES "Validator"(id),
  "position" VARCHAR(10),
  "confidence" INTEGER,
  "reasoning" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### 2. Migrate Existing Data
```typescript
// Script to convert existing sessions
async function migrateVoteSessions() {
  const sessions = await prisma.voteSession.findMany({
    include: { ValidatorResponse: true }
  });
  
  for (const session of sessions) {
    // Convert queryText to statement
    const statement = StatementNormalizer.normalize(session.queryText);
    
    // Calculate probability from YES/NO votes
    const probability = (session.votesYes / (session.votesYes + session.votesNo)) * 100;
    
    await prisma.voteSession.update({
      where: { id: session.id },
      data: {
        statement: statement.statement,
        probability,
        consensusStrength: getStrength(session)
      }
    });
  }
}
```

## Truth Arena MVP Implementation

### 1. Daily Challenge System
```typescript
// /lib/truth-arena/daily-challenge.ts
export class DailyChallenge {
  static async getTodaysChallenge(): Promise<Challenge> {
    // Rotate through curated controversial questions
    // Or select from recent high-disagreement queries
  }
  
  static async submitPrediction(userId: string, prediction: number) {
    // Store user prediction
    // Compare to AI consensus
    // Calculate initial score
  }
  
  static async checkResolution(challengeId: string) {
    // Check if enough time has passed
    // Gather resolution evidence
    // Calculate final scores
  }
}
```

### 2. Arena UI Component
```tsx
// /app/arena/page.tsx
export default function TruthArena() {
  const challenge = useDailyChallenge();
  const [userPrediction, setUserPrediction] = useState(50);
  
  return (
    <div className="truth-arena">
      <h1>Truth Arena</h1>
      <Card className="challenge-card">
        <h2>Today's Challenge</h2>
        <p className="statement">{challenge.statement}</p>
        
        <div className="ai-consensus">
          AI Consensus: {challenge.aiProbability}%
        </div>
        
        <Slider
          value={userPrediction}
          onChange={setUserPrediction}
          min={0}
          max={100}
        />
        
        <Button onClick={() => submitPrediction(userPrediction)}>
          Lock In Prediction
        </Button>
      </Card>
    </div>
  );
}
```

## Rollout Strategy

### Phase 1: Shadow Mode (Week 1)
1. Implement new system alongside old
2. Log both results for comparison
3. No user-facing changes

### Phase 2: Beta Toggle (Week 2)
1. Add feature flag for beta users
2. Show both old and new results
3. Gather feedback

### Phase 3: Gradual Migration (Week 3)
1. Default new users to Truth Market
2. Migrate existing users in batches
3. Monitor metrics

### Phase 4: Full Launch (Week 4)
1. Remove old system
2. Clean up codebase
3. Celebrate! 🎉

## Key Files to Modify/Create

**New Files:**
- `/lib/truth-market/core.ts`
- `/lib/truth-market/statement-normalizer.ts`
- `/lib/truth-market/consensus-engine.ts`
- `/lib/truth-market/market-prompt.ts`
- `/components/truth-market/truth-result.tsx`
- `/app/arena/page.tsx`

**Modified Files:**
- `/app/api/broadcast-query/route.ts`
- `/app/ask/page.tsx`
- `/prisma/schema.prisma`
- `/store/query-store.ts`

**Deleted Files:**
- `/lib/ai/queryClassifier.ts`
- `/lib/ai/adaptive-response-processor.ts`
- `/lib/ai/prompts/*`
- `/components/ask/adaptive-results-display.tsx`

This is your roadmap to Truth Market. Start with Phase 1 and iterate from there!