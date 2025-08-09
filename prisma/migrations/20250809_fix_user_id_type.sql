-- Fix user_id column type to match User table
ALTER TABLE blind_test_sessions 
ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text;