# LLM Provider Analysis & Query Mode Strategy

## Current LLM Providers

### Active Providers (6 total):
1. **OpenAI**
   - GPT-4o (most capable)
   - GPT-4 (very capable)
   - GPT-3.5-turbo (fast, less capable)

2. **Anthropic**
   - Claude-3-opus (most capable)
   - Claude-3-sonnet (balanced)
   - Claude-3-haiku (fast)

3. **Google Gemini**
   - Gemini-1.5-flash (fast)
   - Gemini-pro (balanced)

4. **OpenRouter**
   - Proxy to multiple providers
   - Flexible model selection

5. **HuggingFace**
   - Open source models
   - Variable performance

6. **Grok** (implemented but not registered)
   - Grok-2-latest

## Current Issues

1. **State Synchronization Problem**: 
   - LLM store tracks enabled/disabled state
   - Query store has separate `selectedLLMIds`
   - They don't sync when Fast/Balanced/Custom buttons are clicked

2. **Model Selection Logic**:
   - Fast: Searches for keywords like "turbo", "mini", "fast"
   - Balanced: Searches for "gpt-4", "claude", "opus"
   - Problem: Keywords don't match actual model names well

## Recommended Query Mode Strategy

Given v3ra's goal of truth verification through AI consensus:

### Fast Mode (3 AIs)
**Purpose**: Quick fact-checking for simple queries
**Selection**: Fastest models with decent accuracy
```
- GPT-3.5-turbo (OpenAI)
- Gemini-1.5-flash (Google)  
- Claude-3-haiku (Anthropic)
```

### Balanced Mode (5 AIs)
**Purpose**: Standard truth verification with diverse perspectives
**Selection**: Mix of providers and capabilities
```
- GPT-4 (OpenAI)
- Claude-3-sonnet (Anthropic)
- Gemini-pro (Google)
- Mixtral-8x7B (via OpenRouter)
- Llama-3-70B (via HuggingFace)
```

### Custom Mode (All Available)
**Purpose**: Maximum consensus for critical queries
**Selection**: All available models (currently ~10-15)

## Implementation Strategy

1. **Fix State Management**:
   - Sync LLM store enabled state with query store selectedLLMIds
   - Update query store when buttons are clicked

2. **Improve Model Selection**:
   - Use model IDs directly instead of keyword matching
   - Group models by speed/capability tiers

3. **Add Visual Feedback**:
   - Show which mode is active
   - Display selected models count
   - Show estimated response time

4. **Optimize for Truth Verification**:
   - Prioritize model diversity over raw capability
   - Ensure different providers in each mode
   - Balance speed vs accuracy based on use case