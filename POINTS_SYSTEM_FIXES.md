# V3RA Points System Security Fixes

This document outlines the critical fixes implemented to address data integrity and security issues in the V3RA points system.

## 1. Database Schema Updates

### Added Foreign Key Constraints
- `UserPoints.userId` → `User.id` (CASCADE DELETE)
- `PointsTransaction.userId` → `User.id` (CASCADE DELETE)  
- `PredictionMarket.creatorId` → `User.id`
- `MarketBet.userId` → `User.id`

### Added Missing Fields
- `PredictionMarket.totalStake` - Track total staked amount
- `PredictionMarket.isResolved` - Boolean flag for resolution status
- `PredictionMarket.finalOutcome` - Store resolution outcome
- `UserPoints.version` - Optimistic locking to prevent race conditions

### Added Check Constraints
- `UserPoints.balance >= 0` - Prevent negative balances
- `MarketBet.amount > 0` - Ensure positive bet amounts

### Added Enum Values
- `BET_PLACED` - Track when bets are placed
- `PREDICTION_WIN` - Track prediction winnings (was missing)

### New Indexes
- `PointsTransaction(userId, createdAt DESC)` - Optimize transaction history queries

## 2. Atomic Transaction Implementation

### Bet Placement (`PredictionMarketService.placeBet`)
Before: Points deducted separately from bet creation (could fail and lose points)
After: Wrapped in database transaction with:
- Optimistic locking on UserPoints
- Atomic balance update
- Transaction logging
- Rollback on any failure

### Market Staking (`PredictionMarketService.stakeToMarket`)
Before: Non-atomic points deduction
After: Full transaction with:
- Balance validation
- Stake recording
- Market activation logic
- Pool initialization

### Daily Bonus (`V3RAPointsService.claimDailyBonus`)
Before: Separate updates for points and streak
After: Atomic transaction ensuring consistency

## 3. Fixed Schema Mismatches

### Resolution Endpoint (`/api/headlines/resolve`)
- Changed `bet.stake` → `bet.amount`
- Calculate `totalPool` from sum of pools instead of non-existent field
- Use correct enum value `BET_WIN` instead of `PREDICTION_WIN`
- Update bet status to `WON`/`LOST`
- Fixed field name `resolvedAt` → `settledAt`

## 4. Transaction Logging

All point movements now create `PointsTransaction` records:
- Bet placements (`BET_PLACED`)
- Bet wins (`BET_WIN`) 
- Bet losses (`BET_LOSS`)
- Market staking (`MARKET_CREATE`)
- Daily bonuses (`DAILY_BONUS`)

Each transaction includes:
- Amount changed
- Balance after transaction
- Description
- Metadata (bet details, odds, etc.)

## 5. Security Improvements

### Optimistic Locking
- Added `version` field to UserPoints
- Prevents concurrent balance updates
- Automatic retry on version conflicts

### Input Validation
- Balance checks before any deduction
- Positive amount validation
- Market status validation

### Error Handling
- Proper error messages for insufficient funds
- Transaction rollback on any failure
- No partial state updates

## Migration Steps

1. **Apply Database Migration**
   ```bash
   # Run the migration SQL file
   psql $DATABASE_URL < prisma/migrations/add_points_constraints.sql
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Deploy Code Changes**
   - All service methods now use transactions
   - API endpoints handle new response formats
   - Error handling improvements

## Testing Recommendations

1. **Concurrent Updates**: Test multiple users claiming bonuses simultaneously
2. **Failed Transactions**: Simulate database errors during bet placement
3. **Balance Integrity**: Verify no negative balances after stress testing
4. **Transaction History**: Confirm all actions create transaction records

## Monitoring

Monitor for:
- Transaction rollback frequency
- Optimistic locking retries
- Negative balance attempts
- Missing transaction records

The system is now significantly more robust with proper data integrity constraints and atomic operations throughout.