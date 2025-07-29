# V3RA Implementation Guide

## Quick Start

### 1. Install Required Dependencies

```bash
npm install canvas-confetti
```

### 2. Create Feature Directories

```bash
mkdir -p src/features/ai-versus/components
mkdir -p src/features/rewards/scratch-card  
mkdir -p src/features/onboarding
```

### 3. Integrate Dual Response Component

In your AI consensus page (`src/app/ask/page.tsx`), replace the current implementation with:

```typescript
import { DualResponseCard } from '@/features/ai-versus/components/DualResponseCard'
import { ScratchCardReveal } from '@/features/rewards/scratch-card/ScratchCardReveal'
import { useState } from 'react'

export default function AskPage() {
  const [showReward, setShowReward] = useState(false)
  const [rewardAmount, setRewardAmount] = useState(0)

  const handleVote = async (winnerId: string) => {
    // Submit vote to backend
    const response = await fetch('/api/votes', {
      method: 'POST',
      body: JSON.stringify({ winnerId, prompt, sessionId })
    })
    
    const { reward } = await response.json()
    
    // Show scratch card
    setRewardAmount(reward)
    setShowReward(true)
  }

  return (
    <>
      <DualResponseCard
        prompt={userPrompt}
        leftModel={model1}
        rightModel={model2}
        leftResponse={response1}
        rightResponse={response2}
        onVote={handleVote}
      />
      
      <ScratchCardReveal
        reward={rewardAmount}
        isOpen={showReward}
        onComplete={() => setShowReward(false)}
      />
    </>
  )
}
```

### 4. Add Onboarding to Layout

In `src/app/layout.tsx`:

```typescript
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'

export default function RootLayout({ children }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('v3ra_onboarding_complete')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [])
  
  const completeOnboarding = () => {
    localStorage.setItem('v3ra_onboarding_complete', 'true')
    setShowOnboarding(false)
  }
  
  return (
    <>
      {children}
      <OnboardingFlow 
        isOpen={showOnboarding}
        onComplete={completeOnboarding}
      />
    </>
  )
}
```

### 5. Create Voting API Endpoint

Create `src/app/api/votes/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Weighted random reward generator
function generateReward(): number {
  const rand = Math.random()
  if (rand < 0.70) return 10      // 70% chance
  if (rand < 0.95) return 50      // 25% chance  
  return 100                       // 5% chance
}

export async function POST(request: Request) {
  const { winnerId, prompt, sessionId } = await request.json()
  const supabase = createClient()
  
  // Record vote
  await supabase.from('votes').insert({
    winner_model_id: winnerId,
    prompt,
    session_id: sessionId,
    timestamp: new Date().toISOString()
  })
  
  // Generate reward
  const reward = generateReward()
  
  // Update user points
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('points_transactions').insert({
      user_id: user.id,
      amount: reward,
      type: 'VOTE_REWARD',
      description: 'Earned from AI comparison vote'
    })
  }
  
  return NextResponse.json({ reward })
}
```

### 6. Update Navigation

Add the new AI Versus option to your navigation:

```typescript
const navItems = [
  { href: '/', label: 'Home' },
  { href: '/ai-versus', label: 'AI Versus' }, // New
  { href: '/headlines', label: 'Headlines' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile', label: 'Profile' }
]
```

### 7. Performance Optimizations

Add these to `next.config.js`:

```javascript
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', '@radix-ui']
  }
}
```

### 8. Add PWA Support

Install PWA plugin:

```bash
npm install next-pwa
```

Update `next.config.js`:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  // ... existing config
})
```

## Testing the Implementation

1. **Test Dual Response Flow**
   - Navigate to `/ai-versus`
   - Enter a prompt
   - Verify both AI responses load
   - Click to vote
   - Confirm scratch card appears

2. **Test Onboarding**
   - Clear localStorage
   - Refresh the app
   - Verify onboarding appears
   - Complete all steps
   - Confirm it doesn't reappear

3. **Test Performance**
   - Run Lighthouse audit
   - Target: >95 score
   - Check bundle size (<200KB initial)
   - Verify 60fps animations

## Next Steps

1. Implement feedback bonus system
2. Add model selection/randomization
3. Create admin dashboard
4. Set up A/B testing framework
5. Add share functionality
6. Implement referral system

## Design System Updates

Consider updating your Tailwind config for consistency:

```javascript
// tailwind.config.ts
theme: {
  extend: {
    animation: {
      'float': 'float 3s ease-in-out infinite',
      'glow': 'glow 2s ease-in-out infinite alternate',
    },
    keyframes: {
      float: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
      },
      glow: {
        '0%': { boxShadow: '0 0 20px rgba(6,182,212,0.5)' },
        '100%': { boxShadow: '0 0 30px rgba(6,182,212,0.8)' },
      }
    }
  }
}
```