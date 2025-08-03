-- Add performance indexes for V3RA

-- UserPoints indexes (for leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_userpoints_balance ON "UserPoints"(balance DESC);
CREATE INDEX IF NOT EXISTS idx_userpoints_totalearned ON "UserPoints"("totalEarned" DESC);
CREATE INDEX IF NOT EXISTS idx_userpoints_updatedat ON "UserPoints"("updatedAt" DESC);

-- PointsTransaction indexes (for history queries)
CREATE INDEX IF NOT EXISTS idx_pointstransaction_userid_createdat ON "PointsTransaction"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_pointstransaction_type_createdat ON "PointsTransaction"(type, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_pointstransaction_createdat ON "PointsTransaction"("createdAt" DESC);

-- VoteSession indexes (for user queries)
CREATE INDEX IF NOT EXISTS idx_votesession_userid_timestamp ON "VoteSession"("userId", timestamp DESC) WHERE "userId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votesession_mode ON "VoteSession"(mode) WHERE mode IS NOT NULL;

-- vote_details indexes (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vote_details') THEN
        CREATE INDEX IF NOT EXISTS idx_votedetails_userid_createdat ON vote_details(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_votedetails_votesessionid ON vote_details(vote_session_id);
    END IF;
END $$;