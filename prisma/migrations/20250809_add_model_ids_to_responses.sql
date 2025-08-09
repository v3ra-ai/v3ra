-- Add model_a_id and model_b_id columns to blind_test_responses table
ALTER TABLE blind_test_responses 
ADD COLUMN IF NOT EXISTS model_a_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS model_b_id VARCHAR(255);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_blind_test_responses_model_a ON blind_test_responses(model_a_id);
CREATE INDEX IF NOT EXISTS idx_blind_test_responses_model_b ON blind_test_responses(model_b_id);