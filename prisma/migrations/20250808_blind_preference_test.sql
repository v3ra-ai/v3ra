-- Create blind test sessions table
CREATE TABLE IF NOT EXISTS blind_test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES "User"(id) ON DELETE CASCADE,
  session_type VARCHAR(50) DEFAULT 'gpt_comparison', -- 'gpt_comparison', 'general', etc.
  model_a_id VARCHAR(255) NOT NULL,
  model_b_id VARCHAR(255) NOT NULL,
  total_questions INT DEFAULT 10,
  completed_questions INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  reward_points INT,
  scratch_card_claimed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blind test questions table (pre-selected questions)
CREATE TABLE IF NOT EXISTS blind_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category VARCHAR(100), -- 'reasoning', 'creative', 'technical', 'general', etc.
  difficulty VARCHAR(50), -- 'easy', 'medium', 'hard'
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blind test responses table
CREATE TABLE IF NOT EXISTS blind_test_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES blind_test_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES blind_test_questions(id),
  question_number INT NOT NULL,
  model_a_response TEXT NOT NULL,
  model_b_response TEXT NOT NULL,
  model_a_response_time INT, -- milliseconds
  model_b_response_time INT, -- milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blind test votes table (user preferences)
CREATE TABLE IF NOT EXISTS blind_test_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES blind_test_sessions(id) ON DELETE CASCADE,
  response_id UUID REFERENCES blind_test_responses(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  selected_position CHAR(1) NOT NULL CHECK (selected_position IN ('A', 'B')), -- Which position was selected
  selected_model_id VARCHAR(255) NOT NULL, -- Actual model that was selected
  not_selected_model_id VARCHAR(255) NOT NULL, -- Model that wasn't selected
  vote_reason VARCHAR(100), -- 'conciseness', 'accuracy', 'creativity', 'technical', 'overall'
  time_to_decide INT, -- milliseconds
  user_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blind test analytics table (aggregated data)
CREATE TABLE IF NOT EXISTS blind_test_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(255) NOT NULL,
  comparison_model_id VARCHAR(255) NOT NULL,
  total_comparisons INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  win_rate DECIMAL(5,4),
  avg_time_to_decide INT, -- milliseconds
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(model_id, comparison_model_id)
);

-- Create indexes for performance
CREATE INDEX idx_blind_test_sessions_user_id ON blind_test_sessions(user_id);
CREATE INDEX idx_blind_test_sessions_status ON blind_test_sessions(status);
CREATE INDEX idx_blind_test_votes_session_id ON blind_test_votes(session_id);
CREATE INDEX idx_blind_test_votes_selected_model ON blind_test_votes(selected_model_id);
CREATE INDEX idx_blind_test_analytics_model_id ON blind_test_analytics(model_id);

-- Insert pre-selected questions for GPT-4o vs GPT-5 comparison
INSERT INTO blind_test_questions (question_text, category, difficulty) VALUES
  ('Explain quantum computing to a 10-year-old using a creative analogy', 'creative', 'medium'),
  ('Write a Python function that finds the longest palindromic substring in a given string', 'technical', 'medium'),
  ('What are the ethical implications of AI in healthcare decision-making?', 'reasoning', 'hard'),
  ('Create a haiku about machine learning', 'creative', 'easy'),
  ('Explain the difference between correlation and causation with real-world examples', 'reasoning', 'medium'),
  ('Design a REST API for a social media application. List the main endpoints and their purposes', 'technical', 'hard'),
  ('What would happen if gravity was 10% stronger on Earth?', 'reasoning', 'medium'),
  ('Write a short story (3 sentences) about a robot learning to paint', 'creative', 'easy'),
  ('Debug this code: def factorial(n): return n * factorial(n-1)', 'technical', 'easy'),
  ('How would you explain the concept of democracy to someone from a society that has never had one?', 'reasoning', 'hard')
ON CONFLICT DO NOTHING;