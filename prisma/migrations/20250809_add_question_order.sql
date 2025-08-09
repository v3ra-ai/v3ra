-- Add question_order column to store the order of questions for each session
ALTER TABLE blind_test_sessions 
ADD COLUMN IF NOT EXISTS question_order JSONB;