# Testnet Demo System Improvements

## Design Philosophy
Following Steve Jobs and Jack Dorsey's principles: **Simple. Elegant. Powerful.**

## 1. Query Classification Enhancement

### Current State Analysis
- Basic classification into 6 categories
- Missing PREDICTION implementation in adaptive-prompts.ts
- No persistent tracking of query categories
- No user interaction history

### Proposed Improvements

#### A. Complete Query Classification System
```typescript
// Enhanced Query Categories with clear user value
enum QueryCategory {
  FACT_CHECK = "fact_check",        // Binary truth verification
  PREDICTION = "prediction",        // Future events with probabilities
  PHILOSOPHICAL = "philosophical",  // Deep questions, multiple perspectives
  OPINION = "opinion",             // Subjective topics, debate-worthy
  KNOWLEDGE = "knowledge",         // Information seeking
  CURRENT_EVENTS = "current_events" // Recent happenings
}
```

#### B. Smart Classification Features
- **Auto-tagging**: Extract entities, topics, timeframes
- **Confidence scoring**: How sure are we about the classification?
- **User feedback loop**: "Was this categorized correctly?" ✓/✗

## 2. Prediction Market System

### Core Features
```typescript
interface Prediction {
  id: string;
  question: string;
  outcomes: PredictionOutcome[];
  resolutionDate: Date;
  category: PredictionCategory; // sports, politics, tech, etc.
  marketCap: number;           // Total tokens staked
  status: 'open' | 'closed' | 'resolved';
}

interface PredictionOutcome {
  id: string;
  description: string;
  probability: number;      // AI consensus probability
  marketProbability: number; // User betting probability
  totalStaked: number;      // Tokens staked on this outcome
}
```

### User Experience
1. **Browse Predictions**: Filter by category, resolution date, popularity
2. **Stake Tokens**: Simple slider UI to allocate tokens to outcomes
3. **Track Performance**: "My Predictions" dashboard with P&L
4. **Resolution**: Automated where possible, community vote as fallback

## 3. Truth Arena

### Daily Question Flow
```
Morning (8 AM local)          Evening (8 PM local)
    ↓                              ↓
[New Question]              [Results Revealed]
    ↓                              ↓
[4 AI Answers]              [Leaderboard Update]
    ↓                              ↓
[User Votes]                [Tomorrow's Preview]
```

### Voting Mechanism
```typescript
interface TruthArenaQuestion {
  id: string;
  date: Date;
  question: string;
  category: QueryCategory;
  aiResponses: AIResponse[];
  userVotes: UserVote[];
  winningResponseId?: string;
}

interface AIResponse {
  id: string;
  modelName: string;
  response: string;
  voteCount: number;
  // Hidden until voting closes
  modelProvider?: string;
}
```

### Engagement Features
- **Blind Voting**: Model names hidden during voting
- **Explanation Required**: Users explain why they chose an answer
- **Social Sharing**: "I voted for..." with beautiful card generation
- **Stats Dashboard**: See which models perform best by category

## 4. Gamification Strategy

### Core Loop (Inspired by Wordle)
1. **Daily Habit**: One question per day at consistent time
2. **Streak System**: 🔥 7, 30, 100 day streaks with badges
3. **Social Proof**: Share results without spoilers
4. **Limited Time**: 24 hours to participate

### Progression System
```typescript
interface UserProgress {
  level: number;          // 1-100
  xp: number;            // Experience points
  streakDays: number;    // Current streak
  badges: Badge[];       // Achievements
  rank: number;          // Global ranking
  weeklyRank: number;    // Weekly competition
}
```

### Rewards
- **XP Sources**: Daily voting, correct predictions, quality explanations
- **Levels**: Unlock features (more predictions, exclusive questions)
- **Badges**: First vote, perfect week, prediction prophet, etc.
- **Leaderboards**: Global, weekly, by category

## 5. Database Schema Evolution

### New Tables

```sql
-- Query classification and analytics
CREATE TABLE query_classifications (
  id UUID PRIMARY KEY,
  vote_session_id UUID REFERENCES vote_sessions(id),
  category VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2),
  tags TEXT[], -- Topics, entities
  user_feedback BOOLEAN, -- Was classification correct?
  created_at TIMESTAMP DEFAULT NOW()
);

-- Predictions market
CREATE TABLE predictions (
  id UUID PRIMARY KEY,
  question TEXT NOT NULL,
  category VARCHAR(50),
  resolution_date TIMESTAMP,
  resolution_criteria TEXT,
  status VARCHAR(20),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE prediction_outcomes (
  id UUID PRIMARY KEY,
  prediction_id UUID REFERENCES predictions(id),
  description TEXT,
  ai_probability DECIMAL(3,2),
  market_probability DECIMAL(3,2),
  total_staked DECIMAL(10,2),
  final_result BOOLEAN -- NULL until resolved
);

CREATE TABLE user_stakes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  outcome_id UUID REFERENCES prediction_outcomes(id),
  amount DECIMAL(10,2),
  potential_payout DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Truth Arena
CREATE TABLE truth_arena_questions (
  id UUID PRIMARY KEY,
  date DATE UNIQUE,
  question TEXT,
  category VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE truth_arena_responses (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES truth_arena_questions(id),
  validator_id UUID REFERENCES validators(id),
  response TEXT,
  vote_count INTEGER DEFAULT 0,
  explanation_quality_score DECIMAL(3,2)
);

CREATE TABLE truth_arena_votes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  response_id UUID REFERENCES truth_arena_responses(id),
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, response_id)
);

-- Gamification
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  predictions_made INTEGER DEFAULT 0,
  predictions_won INTEGER DEFAULT 0,
  truth_votes_cast INTEGER DEFAULT 0,
  last_active DATE
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  badge_type VARCHAR(50),
  earned_at TIMESTAMP DEFAULT NOW()
);
```

## 6. UI/UX Improvements

### Design Principles
1. **One Thing Well**: Each page has a single, clear purpose
2. **Progressive Disclosure**: Start simple, reveal complexity as needed
3. **Delightful Details**: Smooth animations, satisfying interactions
4. **Mobile First**: Core features perfect on phone

### Key Screens

#### Home Dashboard
```
[Today's Truth Arena Question]
    Large, can't miss it
    Time remaining: 14h 23m

[Your Active Predictions]
    3 resolving this week
    Current P&L: +127 tokens

[Quick Stats]
    🔥 7 day streak
    📊 Level 12 (2,340 XP)
    🏆 Rank #1,234
```

#### Question Flow
1. **Ask**: Voice input, auto-classification
2. **Process**: Beautiful loading animation
3. **Results**: Adaptive display based on category
4. **Engage**: Save, share, stake, discuss

#### Mobile Experience
- **Swipe Navigation**: Between daily questions
- **Pull to Refresh**: Update predictions
- **Quick Actions**: Long press for options
- **Haptic Feedback**: Subtle vibrations on actions

## 7. Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. Fix PREDICTION category in adaptive-prompts.ts
2. Add query_classifications table and tracking
3. Implement basic Truth Arena (one question/day)
4. Create user_stats table and XP system

### Phase 2: Engagement (Week 3-4)
1. Build Truth Arena voting UI
2. Add streak tracking and badges
3. Implement leaderboards
4. Mobile optimizations

### Phase 3: Prediction Markets (Week 5-6)
1. Create prediction tables and API
2. Build prediction browsing/staking UI
3. Implement token mechanics
4. Add resolution system

### Phase 4: Polish (Week 7-8)
1. Animations and transitions
2. Social sharing cards
3. Push notifications
4. Analytics dashboard

## Success Metrics
- **Daily Active Users**: Target 60% DAU/MAU
- **Streak Retention**: 40% maintain 7-day streaks
- **Prediction Participation**: 30% of users stake tokens
- **Truth Arena Voting**: 80% completion rate
- **Social Shares**: 20% share rate

## Technical Considerations
- **Caching**: Redis for leaderboards, daily questions
- **Real-time**: WebSockets for live prediction updates
- **Background Jobs**: Question generation, result calculation
- **API Rate Limiting**: Prevent gaming the system
- **Fraud Detection**: Monitor suspicious betting patterns

## Conclusion
By focusing on **one delightful experience at a time**, we can build something people genuinely want to use daily. Start with Truth Arena as the hook, add predictions for depth, and use gamification as the retention glue.

Remember: Every feature should feel **obvious** in hindsight.