// Shared model preset configurations to ensure consistency across the app

// Knowledge models - prioritize latest models with recent training data
export const KNOWLEDGE_MODEL_PRIORITY = [
  "Claude Opus 4",           // March 2025 knowledge
  "GPT-4.5",                // Latest OpenAI with newest data
  "Claude 4 Sonnet",        // March 2025 knowledge
  "Qwen3",                  // Latest Chinese model
  "GPT-4o",                  // Latest OpenAI flagship
  "Gemini 2.0 Pro",         // January 2025 knowledge
  "Grok-3",                 // February 2025 knowledge
  "Perplexity AI",          // Real-time web access
  "Perplexity Online",      // Real-time web access
  "Claude 3.5 Sonnet",      // April 2024 knowledge
  "Mistral Large",          // July 2024 knowledge
  "Gemini 2.0 Flash",       // Fast with recent knowledge
  "GPT-4 Turbo"            // Good fallback option
];

// Reasoning models - prioritize deep thinking and analysis
export const REASONING_MODEL_PRIORITY = [
  "Claude Opus 4",          // Best overall reasoning
  "DeepSeek R1",           // Chinese o1-level reasoning
  "Qwen3",                 // Highest performing, matches/exceeds o1
  "o1",                     // OpenAI reasoning specialist
  "GPT-4.5",               // Unsupervised learning focus
  "Claude 4 Sonnet",       // Balanced reasoning, Opus 4's sibling
  "Perplexity AI",         // Deep search & reasoning
  "GPT-4o",                 // Strong general reasoning
  "Gemini 2.0 Pro",        // Google's best
  "Claude 3.5 Sonnet",     // Still excellent
  "Grok-3",                // Latest xAI
  "Mistral Large",         // European flagship
  "Llama 3.1 405B",       // Largest open model
  "DeepSeek Chat"         // Good alternative
];