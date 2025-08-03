-- ============================================================================
-- ADD MISSING USERNAME COLUMN
-- ============================================================================
-- This migration adds the missing username column to the User table
-- ============================================================================

-- Add username column to User table if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- Add unique constraint on username if it doesn't exist
DO $$ 
BEGIN
    PERFORM 1 FROM pg_constraint 
    WHERE conname = 'User_username_key' 
    AND conrelid = '"User"'::regclass;
    
    IF NOT FOUND THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
    END IF;
END $$;