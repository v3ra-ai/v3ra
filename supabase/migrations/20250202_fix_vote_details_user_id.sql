-- ============================================================================
-- FIX VOTE_DETAILS USER_ID COLUMN
-- ============================================================================
-- Ensure vote_details.user_id is TEXT to match User.id
-- ============================================================================

-- First check if the column exists and what type it is
DO $$ 
BEGIN
    -- Check if user_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vote_details' 
        AND column_name = 'user_id'
    ) THEN
        -- Check if it's UUID type
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'vote_details' 
            AND column_name = 'user_id'
            AND data_type = 'uuid'
        ) THEN
            -- Drop any dependent constraints first
            ALTER TABLE vote_details DROP CONSTRAINT IF EXISTS vote_details_user_id_fkey;
            
            -- Change column type from UUID to TEXT
            ALTER TABLE vote_details ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
        END IF;
    ELSE
        -- Column doesn't exist, add it
        ALTER TABLE vote_details ADD COLUMN user_id TEXT;
    END IF;
END $$;

-- Ensure the column is NOT NULL
ALTER TABLE vote_details ALTER COLUMN user_id SET NOT NULL;

-- Re-create index if needed
CREATE INDEX IF NOT EXISTS "vote_details_user_id_idx" ON "vote_details"("user_id");