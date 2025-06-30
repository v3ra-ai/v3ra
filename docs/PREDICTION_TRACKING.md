# Prediction Tracking System

## Overview

The prediction tracking system allows us to:
1. Store predictions made by AI models with probabilities
2. Track when predictions should be resolved
3. Verify actual outcomes
4. Calculate accuracy metrics over time
5. Identify which models perform best in different domains

## Architecture

### Database Schema

#### Core Tables
- `predictions` - Main prediction records linked to vote sessions
- `prediction_outcomes` - Possible outcomes with consensus probabilities
- `model_predictions` - Individual model predictions for analysis
- `prediction_resolutions` - Actual outcomes when verified
- `model_performance` - Aggregated performance metrics per model
- `verification_votes` - User votes for disputed outcomes

### Services

#### PredictionTracker (`lib/services/prediction-tracker.ts`)
- Saves predictions from adaptive responses
- Categorizes predictions (sports, politics, finance, etc.)
- Retrieves pending/resolved predictions

#### PredictionResolver (`lib/services/prediction-resolver.ts`)
- Checks predictions ready for resolution
- Implements domain-specific resolvers
- Records resolutions and updates model performance
- Handles manual resolution by users

#### PredictionMetrics (`lib/services/prediction-metrics.ts`)
- Calculates Brier scores for probabilistic accuracy
- Tracks calibration (do 70% predictions happen 70% of the time?)
- Generates model leaderboards
- Provides category-specific performance metrics

## API Endpoints

### GET `/api/predictions`
Fetch predictions by status (pending/resolved) or category

### POST `/api/predictions/resolve`
Manually resolve a prediction with evidence

### GET `/api/predictions/metrics`
Get performance metrics and model leaderboards

### GET `/api/cron/check-predictions`
Cron endpoint to automatically check for resolvable predictions

## UI Components

### PredictionHistory (`components/predictions/prediction-history.tsx`)
- Displays pending and resolved predictions
- Shows probability bars for each outcome
- Indicates if predictions were correct
- Provides resolution evidence

## Usage

### Making a Prediction
When a user asks a prediction question:
1. Query is classified as `QueryCategory.PREDICTION`
2. Models provide structured predictions with probabilities
3. Consensus is calculated by averaging probabilities
4. Prediction is saved to database with expected resolution date

### Resolving Predictions
1. **Automated**: Domain-specific resolvers check APIs for outcomes
2. **Manual**: Users can submit outcomes with evidence
3. **Consensus**: Multiple users verify controversial outcomes

### Viewing Performance
Visit `/predictions` to see:
- Pending predictions awaiting resolution
- Resolved predictions with accuracy
- Model performance metrics
- Calibration charts

## Future Improvements

1. **API Integrations**
   - Sports: ESPN, SportsDB APIs
   - Elections: AP Elections API
   - Finance: Market data APIs

2. **Enhanced Metrics**
   - Proper scoring rules (log score, spherical score)
   - Time-weighted accuracy
   - Confidence interval tracking

3. **Prediction Markets**
   - Compare LLM predictions to market odds
   - Track arbitrage opportunities

4. **Fine-tuning**
   - Use resolved predictions to improve models
   - Domain-specific model training