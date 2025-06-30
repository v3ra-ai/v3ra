# Adding Claude 4 Models to the System

## Overview
This guide explains how to add Claude Opus 4 and Claude Sonnet 4 to your validator system.

## Model Information

### New Claude 4 Models
1. **Claude Opus 4** (`claude-opus-4-20250514`)
   - Most powerful reasoning and analysis
   - Best for complex predictions and deep analysis
   - Highest accuracy but slower

2. **Claude Sonnet 4** (`claude-sonnet-4-20250514`)
   - Balanced performance and speed
   - Great for general predictions
   - Good accuracy with faster responses

### Also Added
3. **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`)
   - Latest 3.5 generation model
   - Excellent balance of capabilities

4. **Claude 3.5 Haiku** (`claude-3-5-haiku-20241022`)
   - Fast and efficient
   - Good for quick predictions

## Steps to Add the Models

### 1. Ensure API Key Access
First, verify your Anthropic API key supports these models:
```bash
# Check if you have an Anthropic API key in the database
npm run check-api-keys
```

### 2. Run the Migration (if needed)
If the prediction tracking tables aren't created yet:
```bash
npx prisma migrate dev
```

### 3. Add the Validators
Run the script to add Claude 4 validators:
```bash
npx tsx scripts/add-claude4-validators.ts
```

### 4. Via OpenRouter (Alternative)
If you're using OpenRouter instead of direct Anthropic API:
- The models are available as:
  - `anthropic/claude-opus-4`
  - `anthropic/claude-sonnet-4`

### 5. Verify Installation
Check that the validators were added:
```sql
-- Run in your database
SELECT profileName, modelName, active 
FROM "Validator" 
WHERE provider = 'Anthropic' 
AND modelName LIKE '%4%'
ORDER BY modelName;
```

## Using the New Models

### For Predictions
The system will automatically use these models based on the priority order:
1. Claude Opus 4 (highest priority for reasoning)
2. Claude Sonnet 4 (second priority)
3. Claude 3.5 Sonnet (third priority)

### Model Selection
The validator selection logic in `lib/services/validatorService.ts` will:
- Pick Claude Opus 4 for complex reasoning tasks
- Use Claude Sonnet 4 for balanced performance
- Fall back to other models if these aren't available

## Expected Improvements

With Claude 4 models, you should see:
1. **Better Prediction Accuracy** - More nuanced probability estimates
2. **Improved Reasoning** - Better explanations for predictions
3. **Higher Consensus** - Models should agree more often
4. **Better Normalization** - Less duplicate outcomes

## Testing the New Models

1. Ask a prediction question:
   ```
   "Who will win the 2025 World Series?"
   ```

2. Check which models responded:
   - Look for model names in the validator results
   - Should see "Claude Opus 4" and "Claude Sonnet 4"

3. Compare accuracy:
   - The prediction probabilities should sum to 100%
   - Outcomes should be properly normalized
   - Model agreement should be higher

## Troubleshooting

### If Models Don't Appear
1. Check API key is active:
   ```sql
   SELECT * FROM "ApiKey" WHERE provider = 'Anthropic' AND "isActive" = true;
   ```

2. Verify validator is active:
   ```sql
   UPDATE "Validator" 
   SET active = true 
   WHERE modelName IN ('claude-opus-4-20250514', 'claude-sonnet-4-20250514');
   ```

### If You Get API Errors
- Verify your Anthropic API key has access to Claude 4 models
- Check rate limits - Claude 4 models may have different limits
- Consider using OpenRouter as a fallback

## Cost Considerations

Claude 4 models are more expensive than previous versions:
- **Opus 4**: Highest cost, use for important predictions
- **Sonnet 4**: Medium cost, good for most use cases
- **3.5 Models**: Lower cost, use for high-volume queries

Consider implementing cost controls in your validator selection logic.