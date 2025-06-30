# Troubleshooting Claude 4 Models in AI Hub

## The models were successfully added to the database!

Claude Opus 4 and Claude Sonnet 4 are now in your system. Here's how to verify:

### 1. Check the API
Visit: http://localhost:3000/api/validators/active

You should see:
- Claude Opus 4 Validator (claude-opus-4-20250514)
- Claude Sonnet 4 Validator (claude-sonnet-4-20250514)
- Claude 3.5 Sonnet Validator (claude-3-5-sonnet-20241022)
- Claude 3.5 Haiku Validator (claude-3-5-haiku-20241022)

### 2. If they don't appear in AI Hub

**Try these steps:**

1. **Refresh the page** - The AI Hub caches data for performance
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

2. **Clear the store cache**:
   ```javascript
   // In browser console
   localStorage.clear()
   sessionStorage.clear()
   ```

3. **Check filters**:
   - Make sure "All Providers" is selected (not filtering by provider)
   - Try searching for "Claude 4" or "Opus 4"
   - Check the "Reasoning" category (Claude models are categorized as reasoning)

4. **Restart the dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

### 3. Model Categories

The Claude 4 models will appear under:
- **Reasoning Models** - Because they contain "claude" and "opus" in their names
- They'll have a brain icon 🧠

### 4. Using Claude 4 Models

1. Go to AI Hub: http://localhost:3000/ai-hub
2. Look for "Claude Opus 4 Validator" and "Claude Sonnet 4 Validator"
3. Click to select them (max 5 models total)
4. Click "Apply Changes"
5. Go back to Ask page and submit a prediction

### 5. Verify in Database

Run this SQL query in Supabase:
```sql
SELECT id, profileName, modelName, active, validatorType
FROM "Validator"
WHERE modelName LIKE '%4%' OR modelName LIKE '%3.5%'
ORDER BY createdAt DESC;
```

You should see 4 new rows for the Claude 4 models.

### 6. If Still Not Working

1. **Check console errors**: Open browser dev tools (F12) and check for errors

2. **Verify API key**: Make sure your Anthropic API key supports Claude 4:
   ```sql
   SELECT * FROM "ApiKey" WHERE provider = 'Anthropic' AND "isActive" = true;
   ```

3. **Force reload validators**:
   ```typescript
   // In browser console
   window.location.href = '/api/validators/active'
   // Then go back to AI Hub
   ```

### Current Status
✅ Models added to database
✅ API returns Claude 4 models
✅ Categorization logic works (reasoning category)
✅ No code changes needed - just UI refresh

The models ARE in the system - you just need to refresh the UI to see them!