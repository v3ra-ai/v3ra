-- Truth Arena Schema
-- Tracks user refinements and builds model performance data

-- Table to store user refinement sessions
CREATE TABLE IF NOT EXISTS truth_refinement_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  user_wallet TEXT,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  questions_refined INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store individual refinement votes
CREATE TABLE IF NOT EXISTS truth_refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES truth_refinement_sessions(id) ON DELETE CASCADE,
  vote_session_id UUID REFERENCES vote_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  selected_response_id TEXT NOT NULL, -- The AI response the user chose
  selected_model_name TEXT NOT NULL,
  selected_provider TEXT NOT NULL,
  selected_answer TEXT NOT NULL, -- YES/NO
  response_time_ms INTEGER, -- How long user took to decide
  agreement_percent INTEGER, -- What % of users agreed with this choice
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track model performance in the arena
CREATE TABLE IF NOT EXISTS model_arena_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  total_selections INTEGER DEFAULT 0,
  total_appearances INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00, -- Calculated: selections/appearances * 100
  avg_agreement_percent DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(model_name, provider)
);

-- Table to track question performance and controversy
CREATE TABLE IF NOT EXISTS question_arena_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_session_id UUID REFERENCES vote_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  total_refinements INTEGER DEFAULT 0,
  consensus_response_id TEXT, -- The most chosen response
  consensus_percentage DECIMAL(5,2) DEFAULT 0.00,
  controversy_score DECIMAL(5,2) DEFAULT 0.00, -- How divided users were
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vote_session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_truth_refinements_session ON truth_refinements(session_id);
CREATE INDEX IF NOT EXISTS idx_truth_refinements_vote_session ON truth_refinements(vote_session_id);
CREATE INDEX IF NOT EXISTS idx_truth_refinements_model ON truth_refinements(selected_model_name, selected_provider);
CREATE INDEX IF NOT EXISTS idx_model_arena_stats_model ON model_arena_stats(model_name, provider);
CREATE INDEX IF NOT EXISTS idx_question_arena_stats_vote_session ON question_arena_stats(vote_session_id);

-- Function to update model arena stats after each refinement
CREATE OR REPLACE FUNCTION update_model_arena_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update model stats
  INSERT INTO model_arena_stats (model_name, provider, total_selections, total_appearances, last_updated)
  VALUES (NEW.selected_model_name, NEW.selected_provider, 1, 1, NOW())
  ON CONFLICT (model_name, provider) 
  DO UPDATE SET 
    total_selections = model_arena_stats.total_selections + 1,
    total_appearances = model_arena_stats.total_appearances + 1,
    last_updated = NOW();
    
  -- Also increment appearances for other models in the same vote session
  INSERT INTO model_arena_stats (model_name, provider, total_selections, total_appearances, last_updated)
  SELECT 
    vr.profile_name,
    vr.provider,
    0,
    1,
    NOW()
  FROM validator_responses vr
  WHERE vr.vote_session_id = NEW.vote_session_id 
    AND NOT (vr.profile_name = NEW.selected_model_name AND vr.provider = NEW.selected_provider)
  ON CONFLICT (model_name, provider)
  DO UPDATE SET
    total_appearances = model_arena_stats.total_appearances + 1,
    last_updated = NOW();
  
  -- Calculate win rates for all affected models
  UPDATE model_arena_stats 
  SET win_rate = CASE 
    WHEN total_appearances > 0 THEN (total_selections::DECIMAL / total_appearances) * 100
    ELSE 0
  END
  WHERE model_name = NEW.selected_model_name AND provider = NEW.selected_provider;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update model stats
DROP TRIGGER IF EXISTS trigger_update_model_arena_stats ON truth_refinements;
CREATE TRIGGER trigger_update_model_arena_stats
  AFTER INSERT ON truth_refinements
  FOR EACH ROW
  EXECUTE FUNCTION update_model_arena_stats();

-- Function to update question stats
CREATE OR REPLACE FUNCTION update_question_arena_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update question stats
  INSERT INTO question_arena_stats (vote_session_id, question_text, total_refinements, last_updated)
  VALUES (NEW.vote_session_id, NEW.question_text, 1, NOW())
  ON CONFLICT (vote_session_id)
  DO UPDATE SET
    total_refinements = question_arena_stats.total_refinements + 1,
    last_updated = NOW();
    
  -- Calculate consensus and controversy
  WITH response_counts AS (
    SELECT 
      selected_response_id,
      COUNT(*) as vote_count,
      AVG(agreement_percent) as avg_agreement
    FROM truth_refinements 
    WHERE vote_session_id = NEW.vote_session_id
    GROUP BY selected_response_id
  ),
  winner AS (
    SELECT 
      selected_response_id,
      vote_count,
      avg_agreement
    FROM response_counts 
    ORDER BY vote_count DESC 
    LIMIT 1
  ),
  total_votes AS (
    SELECT COUNT(*) as total
    FROM truth_refinements 
    WHERE vote_session_id = NEW.vote_session_id
  )
  UPDATE question_arena_stats 
  SET 
    consensus_response_id = winner.selected_response_id,
    consensus_percentage = (winner.vote_count::DECIMAL / total_votes.total) * 100,
    controversy_score = 100 - ((winner.vote_count::DECIMAL / total_votes.total) * 100)
  FROM winner, total_votes
  WHERE vote_session_id = NEW.vote_session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update question stats
DROP TRIGGER IF EXISTS trigger_update_question_arena_stats ON truth_refinements;
CREATE TRIGGER trigger_update_question_arena_stats
  AFTER INSERT ON truth_refinements
  FOR EACH ROW
  EXECUTE FUNCTION update_question_arena_stats();

-- RLS Policies
ALTER TABLE truth_refinement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_refinements ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_arena_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_arena_stats ENABLE ROW LEVEL SECURITY;

-- Allow users to view all arena stats (public data)
CREATE POLICY "Public read access for model_arena_stats" ON model_arena_stats FOR SELECT USING (true);
CREATE POLICY "Public read access for question_arena_stats" ON question_arena_stats FOR SELECT USING (true);

-- Allow users to insert their own refinements
CREATE POLICY "Users can insert their own refinements" ON truth_refinements 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert their own sessions" ON truth_refinement_sessions 
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own refinement data
CREATE POLICY "Users can view their own refinements" ON truth_refinements 
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM truth_refinement_sessions 
      WHERE user_email = auth.jwt() ->> 'email' 
      OR user_wallet = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can view their own sessions" ON truth_refinement_sessions 
  FOR SELECT USING (
    user_email = auth.jwt() ->> 'email' 
    OR user_wallet = auth.jwt() ->> 'sub'
  );