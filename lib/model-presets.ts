// Shared model preset configurations to ensure consistency across the app

// Knowledge models - prioritize latest models with recent training data
export const KNOWLEDGE_MODEL_PRIORITY = [
  "Claude Opus 4",           // March 2025 knowledge
  "GPT-4o",                  // Latest OpenAI flagship
  "Claude Sonnet 4",         // March 2025 knowledge
  "Gemini 2.0 Pro",         // January 2025 knowledge
  "Grok-3",                 // February 2025 knowledge
  "Perplexity Online",      // Real-time web access
  "Claude 3.5 Sonnet",      // April 2024 knowledge
  "Mistral Large",          // July 2024 knowledge
  "Gemini 2.0 Flash",       // Fast with recent knowledge
  "GPT-4 Turbo"            // Good fallback option
];

// Reasoning models - prioritize deep thinking and analysis
export const REASONING_MODEL_PRIORITY = [
  "Claude Opus 4",          // Best overall reasoning
  "o1",                     // OpenAI reasoning specialist
  "Claude Sonnet 4",        // Balanced reasoning
  "GPT-4o",                 // Strong general reasoning
  "Gemini 2.0 Pro",        // Google's best
  "Claude 3.5 Sonnet",     // Still excellent
  "Grok-3",                // Latest xAI
  "Mistral Large",         // European flagship
  "Llama 3.1 405B",       // Largest open model
  "DeepSeek Chat"         // Good alternative
];