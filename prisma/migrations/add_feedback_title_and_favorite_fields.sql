-- Add title field to Feedback table
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "title" TEXT;

-- The Favorite table already has favoriteType and title fields based on the schema
-- So we don't need to add them again