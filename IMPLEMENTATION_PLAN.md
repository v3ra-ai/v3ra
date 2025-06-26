# V3RA Truth Arena - Implementation Plan

## Overview
This plan addresses user feedback while maintaining minimalist design principles. We'll fix critical UX issues and remove unnecessary complexity.

## Phase 1: Authentication Overhaul (Priority: Critical)

### Current Issues:
- Magic link is unreliable
- No password option
- Profile page returns 404
- Logout requires new magic link each time

### Solution:
1. **Implement Simple Email/Password Auth**
   - Remove Supabase magic link system
   - Add password field back to User model
   - Use bcrypt for password hashing
   - JWT tokens in httpOnly cookies
   - Simple session management

2. **Fix User Flow**
   - Combined login/signup page with toggle
   - Clear "Sign In" and "Create Account" CTAs on landing
   - Fix profile page route or remove profile icon
   - Implement proper logout (clear cookie)

3. **Access Control**
   - Allow browsing without login
   - Require login for submitting queries
   - Show login prompt when anonymous user tries to query

### Files to Modify:
- `app/login/` and `app/signup/` - Combine into single auth page
- `lib/auth.ts` - New simplified auth utilities
- `app/api/auth/` - New endpoints for login/signup/logout
- Remove Supabase dependencies

### Files to Delete:
- `lib/supabase-client.ts`
- `lib/supabase-service.ts`
- `app/auth/callback/`
- `app/auth/verify/`

## Phase 2: Query UX Improvements (Priority: High)

### Current Issues:
- No guidance on question format
- All queries stack vertically
- No example questions

### Solution:
1. **Input Guidance**
   - Placeholder: "Ask a factual yes/no question (e.g., 'Is Bitcoin decentralized?')"
   - Small tooltip with more examples
   - Character limit indicator

2. **Response Display**
   - Show only current query prominently
   - Collapsible "Recent Questions" (last 5)
   - "Popular Questions" section with 5-7 examples
   - Clear visual hierarchy

### Files to Modify:
- `components/ask/query/query-form-input.tsx` - Add placeholder and tooltip
- `components/ask/query/query-results.tsx` - Redesign display logic
- `app/ask/page.tsx` - Add popular questions section

## Phase 3: Remove Unused Features (Priority: High)

### Features to Delete Entirely:
1. **Payment System**
   - All credit/payment related code
   - UserCredit model and references
   - Payment API endpoints

2. **Admin System**
   - Admin dashboard components
   - Validator management UI
   - Health monitoring
   - Admin API endpoints

3. **Social Features**
   - Feedback system
   - Favorites
   - Thread/Reply models
   - Social sharing components

4. **Complex Features**
   - Network visualization
   - Expert view mode
   - Validator health monitoring
   - Complex caching system

### API Endpoints to Delete:
- `/api/payment/`
- `/api/user-credits/`
- `/api/check-admin/`
- `/api/favorites/`
- `/api/feedback/`
- `/api/debug-validators/`
- `/api/test-validators/`
- `/api/validators/init/`
- `/api/validators/activate-all/`
- `/api/validators/update-model-name/`
- `/api/health/`
- `/api/og/`

### Components to Delete:
- `components/admin/`
- `components/analytics/`
- `components/feedback-widget.tsx`
- `components/feedback-modal.tsx`
- `components/ask/charts/`
- `components/ask/results/ask-results-expert.tsx`
- `components/explorer/`
- `components/profile/`

### Store Files to Simplify:
- Delete: `feedback-store.ts`, `validator-management-store.ts`, `favorites-store.ts`
- Simplify: `llm-store.ts` (remove profiles, categories)
- Keep minimal: `query-store.ts`, `theme-store.ts`

## Phase 4: UI Polish (Priority: Medium)

### Current Issues:
- Wallet button visible but not functional
- Logo doesn't match V3RA branding
- No social links
- Grid layout as default

### Solution:
1. **Layout**
   - Default to linear layout
   - Remove grid/linear toggle

2. **Branding**
   - Update logo to match V3RA brand
   - Consistent color scheme

3. **UI Elements**
   - Hide wallet button or show "Coming Soon" tooltip
   - Add minimal footer with social icons
   - Clean up navigation

### Files to Modify:
- `components/ask/navbar/navbar.tsx` - Update logo, hide wallet
- `components/ask/ask-footer.tsx` - Add social links
- `app/ask/page.tsx` - Remove layout toggle

## Phase 5: Simplify Architecture (Priority: Medium)

### Database Schema Simplification:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String
  password  String   // Added back
  createdAt DateTime @default(now())
  queries   Query[]  // User's queries
}

model Query {
  id        String   @id @default(uuid())
  userId    String?
  question  String
  createdAt DateTime @default(now())
  user      User?    @relation(fields: [userId], references: [id])
  votes     Vote[]
}

model Vote {
  id          String   @id @default(uuid())
  queryId     String
  validatorId String
  vote        Boolean  // true = YES, false = NO
  rationale   String?
  query       Query    @relation(fields: [queryId], references: [id])
  validator   Validator @relation(fields: [validatorId], references: [id])
}

model Validator {
  id          String   @id @default(uuid())
  name        String
  provider    String
  modelName   String
  active      Boolean  @default(true)
  votes       Vote[]
}
```

### API Simplification:
- `/api/auth/login` - POST
- `/api/auth/signup` - POST
- `/api/auth/logout` - POST
- `/api/auth/me` - GET (current user)
- `/api/query` - POST (submit query)
- `/api/validators` - GET (list active validators)

## Implementation Order

1. **Week 1**: Authentication overhaul
2. **Week 1-2**: Remove unused features (parallel with auth)
3. **Week 2**: Query UX improvements
4. **Week 2-3**: UI polish and testing

## Success Metrics

- Login works reliably in <2 seconds
- New users understand how to ask questions immediately
- Page load time <1 second
- Codebase reduced by 70%+
- Zero 404 errors
- Clear visual hierarchy

## Next Steps

1. Create migration for password field
2. Implement new auth system
3. Start removing unused features
4. Update UI components
5. Test thoroughly
6. Deploy to staging