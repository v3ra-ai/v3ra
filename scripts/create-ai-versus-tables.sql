-- Create AI Versus votes table
CREATE TABLE IF NOT EXISTS ai_versus_votes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  winner_model_id VARCHAR(255) NOT NULL,
  loser_model_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_versus_votes_user_id ON ai_versus_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_versus_votes_winner ON ai_versus_votes(winner_model_id);
CREATE INDEX IF NOT EXISTS idx_ai_versus_votes_loser ON ai_versus_votes(loser_model_id);
CREATE INDEX IF NOT EXISTS idx_ai_versus_votes_created_at ON ai_versus_votes(created_at DESC);

-- Create model statistics table
CREATE TABLE IF NOT EXISTS ai_model_stats (
  model_id VARCHAR(255) PRIMARY KEY,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create functions to increment wins/losses
CREATE OR REPLACE FUNCTION increment_model_wins(model_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_model_stats (model_id, wins, last_updated)
  VALUES (model_id, 1, NOW())
  ON CONFLICT (model_id)
  DO UPDATE SET 
    wins = ai_model_stats.wins + 1,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_model_losses(model_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_model_stats (model_id, losses, last_updated)
  VALUES (model_id, 1, NOW())
  ON CONFLICT (model_id)
  DO UPDATE SET 
    losses = ai_model_stats.losses + 1,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE ai_versus_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "AI versus votes are viewable by everyone" ON ai_versus_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own votes" ON ai_versus_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Model stats are viewable by everyone" ON ai_model_stats
  FOR SELECT USING (true);