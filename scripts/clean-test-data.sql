-- Clean Test Data from Production Database
-- Run this script before beta launch to remove any test/demo data

-- 1. Remove test user bets (users with test/demo prefixes)
DELETE FROM "MarketBet" 
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE email LIKE 'test%@%' 
  OR email LIKE 'demo%@%'
  OR username LIKE 'test_%'
  OR username LIKE 'demo_%'
);

-- 2. Remove old pending prediction markets (older than 7 days)
DELETE FROM "PredictionMarket" 
WHERE status = 'PENDING' 
AND "createdAt" < NOW() - INTERVAL '7 days';

-- 3. Remove orphaned votes (where session no longer exists)
DELETE FROM "votes" 
WHERE "session_id" NOT IN (
  SELECT id FROM "vote_sessions"
);

-- 4. Remove old test vote sessions (optional - only if you want to clear history)
-- DELETE FROM "vote_sessions" 
-- WHERE created_at < NOW() - INTERVAL '30 days';

-- 5. Reset test user points to 0 (or remove test users entirely)
UPDATE "UserPoints"
SET balance = 0, "totalEarned" = 0, "totalSpent" = 0
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE email LIKE 'test%@%' 
  OR email LIKE 'demo%@%'
);

-- 6. Remove feedback from test users
DELETE FROM "feedback"
WHERE user_id IN (
  SELECT id FROM "User" 
  WHERE email LIKE 'test%@%' 
  OR email LIKE 'demo%@%'
);

-- 7. Clean up any validator logs from testing
DELETE FROM "validator_logs"
WHERE created_at < NOW() - INTERVAL '30 days'
AND status = 'error';

-- 8. Remove any test predictions (headlines)
DELETE FROM "Prediction"
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE email LIKE 'test%@%' 
  OR email LIKE 'demo%@%'
);

-- 9. Clean up transaction logs for test users
DELETE FROM "TransactionLog"
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE email LIKE 'test%@%' 
  OR email LIKE 'demo%@%'
);

-- 10. Optional: Remove test users entirely (commented out for safety)
-- DELETE FROM "User" 
-- WHERE email LIKE 'test%@%' 
-- OR email LIKE 'demo%@%'
-- OR username LIKE 'test_%'
-- OR username LIKE 'demo_%';

-- Summary of what will remain:
-- - Real user accounts and their data
-- - Active prediction markets
-- - Recent vote sessions and votes
-- - Valid feedback entries
-- - User points for real users

-- After running this script, verify counts:
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'UserPoints', COUNT(*) FROM "UserPoints"
UNION ALL
SELECT 'PredictionMarkets', COUNT(*) FROM "PredictionMarket"
UNION ALL
SELECT 'MarketBets', COUNT(*) FROM "MarketBet"
UNION ALL
SELECT 'Predictions', COUNT(*) FROM "Prediction"
UNION ALL
SELECT 'VoteSessions', COUNT(*) FROM "vote_sessions"
UNION ALL
SELECT 'Feedback', COUNT(*) FROM "feedback";