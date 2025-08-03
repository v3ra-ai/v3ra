-- Create AI models table as the single source of truth
CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_path VARCHAR(255) UNIQUE NOT NULL, -- e.g., "openai/gpt-4"
  name VARCHAR(255) NOT NULL,              -- e.g., "GPT-4"
  provider VARCHAR(100) NOT NULL,          -- e.g., "OpenAI"
  category VARCHAR(50),                    -- e.g., "premium", "open-source"
  is_active BOOLEAN DEFAULT true,
  capabilities JSONB DEFAULT '[]',         -- ["chat", "code", "vision"]
  strengths JSONB DEFAULT '[]',            -- ["reasoning", "coding"]
  cost_per_comparison DECIMAL(10,4),       -- Cost in USD
  icon VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_models_active ON ai_models(is_active);
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_category ON ai_models(category);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE
    ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial models from our config
INSERT INTO ai_models (model_path, name, provider, category, capabilities, strengths, cost_per_comparison) VALUES
  -- OpenAI
  ('openai/gpt-4', 'GPT-4', 'OpenAI', 'premium', '["chat", "code", "reasoning"]', '["reasoning", "coding", "analysis"]', 0.03),
  ('openai/gpt-4-turbo', 'GPT-4 Turbo', 'OpenAI', 'premium', '["chat", "code", "vision"]', '["speed", "cost-effective"]', 0.01),
  ('openai/gpt-3.5-turbo', 'GPT-3.5 Turbo', 'OpenAI', 'budget', '["chat", "code"]', '["speed", "basic-tasks"]', 0.001),
  
  -- Anthropic
  ('anthropic/claude-3-opus', 'Claude 3 Opus', 'Anthropic', 'premium', '["chat", "code", "analysis"]', '["writing", "reasoning"]', 0.015),
  ('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'Anthropic', 'premium', '["chat", "code"]', '["balanced", "creative"]', 0.003),
  ('anthropic/claude-3-haiku', 'Claude 3 Haiku', 'Anthropic', 'budget', '["chat"]', '["speed", "efficiency"]', 0.00025),
  
  -- Google
  ('google/gemini-pro', 'Gemini Pro', 'Google', 'premium', '["chat", "code", "multimodal"]', '["reasoning", "math"]', 0.00035),
  ('google/gemini-pro-1.5', 'Gemini Pro 1.5', 'Google', 'premium', '["chat", "long-context"]', '["context-window", "analysis"]', 0.00035),
  
  -- Meta
  ('meta-llama/llama-3.1-405b-instruct', 'Llama 3.1 405B', 'Meta', 'open-source', '["chat", "code"]', '["open-source", "customizable"]', 0.005),
  ('meta-llama/llama-3.1-70b-instruct', 'Llama 3.1 70B', 'Meta', 'open-source', '["chat", "code"]', '["efficiency", "open-source"]', 0.0007),
  
  -- Mistral
  ('mistralai/mistral-large', 'Mistral Large', 'Mistral', 'premium', '["chat", "code", "reasoning"]', '["multilingual", "reasoning"]', 0.008),
  ('mistralai/mixtral-8x22b-instruct', 'Mixtral 8x22B', 'Mistral', 'specialist', '["chat", "code"]', '["moe-architecture", "efficiency"]', 0.002),
  
  -- Others
  ('perplexity/sonar-large-online', 'Perplexity Sonar', 'Perplexity', 'specialist', '["search", "real-time"]', '["web-search", "current-events"]', 0.001)
ON CONFLICT (model_path) DO NOTHING;

-- Create a view for active models with full info
CREATE OR REPLACE VIEW active_ai_models AS
SELECT 
  id,
  model_path,
  name,
  provider,
  category,
  capabilities,
  strengths,
  cost_per_comparison,
  icon
FROM ai_models
WHERE is_active = true
ORDER BY provider, name;

-- RLS policies
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Everyone can read active models
CREATE POLICY "Public can view active models" ON ai_models
  FOR SELECT
  USING (is_active = true);

-- Only admins can modify models
CREATE POLICY "Admins can manage models" ON ai_models
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Function to get random model pairs for blind testing
CREATE OR REPLACE FUNCTION get_blind_test_pair(
  p_strategy TEXT DEFAULT 'SMART'
)
RETURNS TABLE(
  model1 JSONB,
  model2 JSONB
) AS $$
BEGIN
  -- Implementation would vary based on strategy
  -- For now, return random pair
  RETURN QUERY
  WITH random_models AS (
    SELECT 
      jsonb_build_object(
        'id', model_path,
        'name', name,
        'provider', provider,
        'category', category
      ) as model_data
    FROM ai_models
    WHERE is_active = true
    ORDER BY RANDOM()
    LIMIT 2
  )
  SELECT 
    (array_agg(model_data))[1] as model1,
    (array_agg(model_data))[2] as model2
  FROM random_models;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_blind_test_pair TO authenticated;