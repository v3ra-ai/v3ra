// Shared model preset configurations to ensure consistency across the app

// Knowledge models - prioritize latest models with recent training data
export const KNOWLEDGE_MODEL_PRIORITY = [
  "Claude 3 Opus",           // Most capable Claude model
  "GPT-4 Turbo",            // Latest OpenAI available
  "Claude 3.5 Sonnet",      // Excellent balance of speed and capability
  "Qwen 2.5 72B",           // Strong multilingual model
  "GPT-4o",                  // OpenAI flagship
  "Gemini 2.0 Pro",         // January 2025 knowledge
  "Grok-3",                 // February 2025 knowledge
  "Perplexity Sonar",       // Real-time web access
  "Perplexity Online",      // Real-time web access
  "DeepSeek Chat",          // Powerful reasoning
  "Mistral Large",          // July 2024 knowledge
  "Gemini 2.0 Flash",       // Fast with recent knowledge
  "Llama 3.1 70B"          // Open source option
];

// Reasoning models - prioritize deep thinking and analysis
export const REASONING_MODEL_PRIORITY = [
  "Claude 3 Opus",          // Best available reasoning
  "DeepSeek Chat",         // Powerful Chinese reasoning model
  "Qwen 2.5 72B",          // Strong performance model
  "o1",                     // OpenAI reasoning specialist
  "GPT-4 Turbo",           // Latest available OpenAI
  "Claude 3.5 Sonnet",     // Excellent balanced reasoning
  "Perplexity Sonar",      // Deep search & reasoning
  "GPT-4o",                 // Strong general reasoning
  "Gemini 2.0 Pro",        // Google's best
  "Grok-3",                // Latest xAI
  "Mistral Large",         // European flagship
  "Llama 3.1 405B",       // Largest open model
  "Command R Plus",        // Enterprise reasoning
  "Mixtral 8x7B"          // MoE architecture
];