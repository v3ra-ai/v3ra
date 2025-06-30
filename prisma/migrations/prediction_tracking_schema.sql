-- Prediction Tracking System Schema
-- This migration adds tables for tracking predictions and their outcomes over time

-- Core prediction tracking
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_session_id UUID REFERENCES "VoteSession"(id),
  query_text TEXT NOT NULL,
  category VARCHAR(50), -- sports, politics, finance, technology, etc.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolution_date TIMESTAMP, -- when we expect to know the outcome
  resolution_status VARCHAR(20) DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'disputed', 'unresolvable')),
  created_by VARCHAR(100),
  metadata JSONB -- flexible field for additional data
);

-- Store each possible outcome with probabilities
CREATE TABLE prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  outcome_text TEXT NOT NULL,
  consensus_probability DECIMAL(5,4) CHECK (consensus_probability >= 0 AND consensus_probability <= 1),
  model_agreement DECIMAL(5,4) CHECK (model_agreement >= 0 AND model_agreement <= 1),
  model_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Individual model predictions for analysis
CREATE TABLE model_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  model_name VARCHAR(100) NOT NULL,
  outcome_text TEXT NOT NULL,
  probability DECIMAL(5,4) CHECK (probability >= 0 AND probability <= 1),
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('LOW', 'MEDIUM', 'HIGH')),
  reasoning TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Track actual outcomes
CREATE TABLE prediction_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  actual_outcome TEXT NOT NULL,
  resolved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolution_method VARCHAR(30) CHECK (resolution_method IN ('automated', 'user_verified', 'consensus', 'official_source')),
  verification_source TEXT, -- URL, API name, user ID, etc.
  evidence TEXT, -- Supporting evidence/links
  resolver_id VARCHAR(100), -- who/what resolved it
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  dispute_count INTEGER DEFAULT 0
);

-- Track model performance over time
CREATE TABLE model_performance (
  model_name VARCHAR(100) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  accurate_predictions INTEGER NOT NULL DEFAULT 0,
  brier_score DECIMAL(5,4), -- proper scoring rule for probabilistic predictions
  calibration_score DECIMAL(5,4), -- how well calibrated the probabilities are
  log_score DECIMAL(6,4), -- logarithmic scoring rule
  category VARCHAR(50),
  metadata JSONB, -- additional metrics
  PRIMARY KEY (model_name, period_start, category)
);

-- User verification votes for disputed predictions
CREATE TABLE verification_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  voted_outcome TEXT NOT NULL,
  evidence TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(prediction_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_predictions_status ON predictions(resolution_status);
CREATE INDEX idx_predictions_date ON predictions(resolution_date);
CREATE INDEX idx_predictions_category ON predictions(category);
CREATE INDEX idx_prediction_outcomes_prediction ON prediction_outcomes(prediction_id);
CREATE INDEX idx_model_predictions_prediction ON model_predictions(prediction_id);
CREATE INDEX idx_resolutions_prediction ON prediction_resolutions(prediction_id);
CREATE INDEX idx_model_performance_date ON model_performance(period_start, period_end);