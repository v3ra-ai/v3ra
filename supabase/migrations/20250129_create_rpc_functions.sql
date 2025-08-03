-- Function to update model matchups
CREATE OR REPLACE FUNCTION update_model_matchup(
  p_model_a TEXT,
  p_model_b TEXT,
  p_category TEXT,
  p_model_a_won BOOLEAN
) RETURNS VOID AS $
BEGIN
  INSERT INTO model_matchups (model_a, model_b, category, model_a_wins, model_b_wins, total_comparisons)
  VALUES (
    p_model_a, 
    p_model_b, 
    p_category,
    CASE WHEN p_model_a_won THEN 1 ELSE 0 END,
    CASE WHEN p_model_a_won THEN 0 ELSE 1 END,
    1
  )
  ON CONFLICT (model_a, model_b, category) DO UPDATE SET
    model_a_wins = model_matchups.model_a_wins + CASE WHEN p_model_a_won THEN 1 ELSE 0 END,
    model_b_wins = model_matchups.model_b_wins + CASE WHEN p_model_a_won THEN 0 ELSE 1 END,
    total_comparisons = model_matchups.total_comparisons + 1,
    updated_at = NOW();
END;
$ LANGUAGE plpgsql;

-- Function to update Elo ratings
CREATE OR REPLACE FUNCTION update_elo_ratings(
  p_winner_id TEXT,
  p_loser_id TEXT,
  p_category TEXT DEFAULT 'overall'
) RETURNS TABLE (
  winner_old INTEGER,
  winner_new INTEGER,
  loser_old INTEGER,
  loser_new INTEGER
) AS $
DECLARE
  v_winner_rating INTEGER;
  v_loser_rating INTEGER;
  v_k_factor INTEGER := 32;
  v_expected_winner NUMERIC;
  v_winner_new INTEGER;
  v_loser_new INTEGER;
BEGIN
  -- Get or create winner rating
  INSERT INTO model_elo_ratings (model_name, provider, category, elo_rating)
  VALUES (p_winner_id, 'default', p_category, 1500)
  ON CONFLICT (model_name, provider, category) DO NOTHING;
  
  SELECT elo_rating INTO v_winner_rating
  FROM model_elo_ratings
  WHERE model_name = p_winner_id AND category = p_category;
  
  -- Get or create loser rating
  INSERT INTO model_elo_ratings (model_name, provider, category, elo_rating)
  VALUES (p_loser_id, 'default', p_category, 1500)
  ON CONFLICT (model_name, provider, category) DO NOTHING;
  
  SELECT elo_rating INTO v_loser_rating
  FROM model_elo_ratings
  WHERE model_name = p_loser_id AND category = p_category;
  
  -- Calculate new ratings
  v_expected_winner := 1.0 / (1.0 + POWER(10, (v_loser_rating - v_winner_rating)::NUMERIC / 400.0));
  v_winner_new := ROUND(v_winner_rating + v_k_factor * (1 - v_expected_winner));
  v_loser_new := ROUND(v_loser_rating + v_k_factor * (0 - v_expected_winner));
  
  -- Update ratings
  UPDATE model_elo_ratings
  SET elo_rating = v_winner_new,
      games_played = games_played + 1,
      peak_rating = GREATEST(peak_rating, v_winner_new),
      last_updated = NOW()
  WHERE model_name = p_winner_id AND category = p_category;
  
  UPDATE model_elo_ratings
  SET elo_rating = v_loser_new,
      games_played = games_played + 1,
      last_updated = NOW()
  WHERE model_name = p_loser_id AND category = p_category;
  
  RETURN QUERY SELECT v_winner_rating, v_winner_new, v_loser_rating, v_loser_new;
END;
$ LANGUAGE plpgsql;