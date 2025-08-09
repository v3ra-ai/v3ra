/**
 * Modular validator model definitions
 * Add or remove validator models by modifying this configuration
 */

export interface ValidatorModel {
  name: string;
  provider: string;
  model_id: string;
  url?: string;
  icon?: string;
}

// OpenAI Models
export const openaiModels: ValidatorModel[] = [
  {
    name: "GPT-5",
    provider: "OpenAI",
    model_id: "gpt-5",
  },
  {
    name: "GPT-4o",
    provider: "OpenAI",
    model_id: "gpt-4o",
  },
  {
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    model_id: "gpt-4-1106-preview",
  },
  {
    name: "GPT-4",
    provider: "OpenAI",
    model_id: "gpt-4",
  },
  {
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    model_id: "gpt-3.5-turbo",
  },
  {
    name: "GPT-3.5 Turbo 16K",
    provider: "OpenAI",
    model_id: "gpt-3.5-turbo-16k",
  },
];

// Anthropic Models
export const anthropicModels: ValidatorModel[] = [
  {
    name: "Claude Opus 4",
    provider: "Anthropic",
    model_id: "claude-opus-4-20250514",
  },
  {
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    model_id: "claude-sonnet-4-20250514",
  },
  {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    model_id: "claude-3-5-sonnet-20241022",
  },
  {
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    model_id: "claude-3-5-haiku-20241022",
  },
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    model_id: "claude-3-opus-20240229",
  },
  {
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    model_id: "claude-3-sonnet-20240229",
  },
  {
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    model_id: "claude-3-haiku-20240307",
  },
  {
    name: "Claude 2.1",
    provider: "Anthropic",
    model_id: "claude-2.1",
  },
  {
    name: "Claude 2",
    provider: "Anthropic",
    model_id: "claude-2",
  },
  {
    name: "Claude Instant",
    provider: "Anthropic",
    model_id: "claude-instant-1.2",
  },
];

// Google Models
export const googleModels: ValidatorModel[] = [
  {
    name: "Gemini 1.5 Flash",
    provider: "Google",
    model_id: "gemini-1.5-flash",
  },
  {
    name: "Gemini 1.5 Pro",
    provider: "Google",
    model_id: "gemini-1.5-pro",
  },
  {
    name: "Gemini 1.0 Pro",
    provider: "Google",
    model_id: "gemini-1.0-pro",
  },
];

// OpenRouter Models - Extended List
export const openRouterModels: ValidatorModel[] = [
  // Google Models via OpenRouter
  {
    name: "Gemini 2.0 Flash (Free)",
    provider: "OpenRouter",
    model_id: "google/gemini-2.0-flash-exp:free",
  },
  {
    name: "Gemini 2.0 Flash Thinking (Free)",
    provider: "OpenRouter",
    model_id: "google/gemini-2.0-flash-thinking-exp:free",
  },
  // Mistral Models
  {
    name: "Mistral 7B",
    provider: "OpenRouter",
    model_id: "mistralai/mistral-7b-instruct",
  },
  {
    name: "Mixtral 8x7B",
    provider: "OpenRouter",
    model_id: "mistralai/mixtral-8x7b-instruct",
  },
  {
    name: "Mixtral 8x22B",
    provider: "OpenRouter",
    model_id: "mistralai/mixtral-8x22b",
  },
  // Meta Models
  {
    name: "Llama 3 70B",
    provider: "Meta",
    model_id: "meta-llama/llama-3-70b-instruct",
  },
  {
    name: "Llama 3 8B",
    provider: "Meta",
    model_id: "meta-llama/llama-3-8b-instruct",
  },
  {
    name: "Code Llama 70B",
    provider: "Meta",
    model_id: "codellama/codellama-70b-instruct",
  },
  // DeepSeek Models
  {
    name: "DeepSeek Coder 33B",
    provider: "DeepSeek",
    model_id: "deepseek/deepseek-coder-33b-instruct",
  },
  {
    name: "DeepSeek Chat 67B",
    provider: "DeepSeek",
    model_id: "deepseek/deepseek-chat-67b",
  },
  // Perplexity Models
  {
    name: "Perplexity Online",
    provider: "Perplexity",
    model_id: "perplexity/pplx-70b-online",
  },
  {
    name: "Perplexity Chat",
    provider: "Perplexity",
    model_id: "perplexity/pplx-70b-chat",
  },
  // Nous Research Models
  {
    name: "Nous Hermes 2 Mixtral",
    provider: "Nous Research",
    model_id: "nousresearch/nous-hermes-2-mixtral-8x7b-sft",
  },
  {
    name: "Nous Capybara 34B",
    provider: "Nous Research",
    model_id: "nousresearch/nous-capybara-34b",
  },
  // Intel/Orca Models
  {
    name: "Neural Chat 7B",
    provider: "Intel",
    model_id: "intel/neural-chat-7b",
  },
  {
    name: "OpenOrca Mistral 7B",
    provider: "OpenOrca",
    model_id: "open-orca/mistral-7b-openorca",
  },
  // Phind Models
  {
    name: "Phind CodeLlama 34B v2",
    provider: "Phind",
    model_id: "phind/phind-codellama-34b-v2",
  },
  // Microsoft Models
  {
    name: "WizardLM 2 8x22B",
    provider: "Microsoft",
    model_id: "microsoft/wizardlm-2-8x22b",
  },
  // Zephyr Models
  {
    name: "Zephyr 7B Beta",
    provider: "Zephyr",
    model_id: "huggingfaceh4/zephyr-7b-beta",
  },
  {
    name: "Zephyr 7B Alpha",
    provider: "Zephyr",
    model_id: "huggingfaceh4/zephyr-7b-alpha",
  },
  // Qwen Models
  {
    name: "Qwen 2.5 72B",
    provider: "Qwen",
    model_id: "qwen/qwen-2.5-72b-instruct",
  },
  {
    name: "Qwen 2.5 32B",
    provider: "Qwen",
    model_id: "qwen/qwen-2.5-32b-instruct",
  },
  {
    name: "Qwen 2.5 14B",
    provider: "Qwen",
    model_id: "qwen/qwen-2.5-14b-instruct",
  },
  {
    name: "Qwen 2.5 7B",
    provider: "Qwen",
    model_id: "qwen/qwen-2.5-7b-instruct",
  },
  {
    name: "Qwen 2.5 3B",
    provider: "Qwen",
    model_id: "qwen/qwen-2.5-3b-instruct",
  },
  {
    name: "Qwen 2.5 1.5B",
    provider: "Qwen",
    model_id: "qwen/qwen-2.5-1.5b-instruct",
  },
  {
    name: "Qwen 2.5 Coder 32B",
    provider: "Qwen",
    model_id: "qwen/qwen-2.5-coder-32b-instruct",
  },
  // xAI Models
  {
    name: "Grok 1",
    provider: "xAI",
    model_id: "xai/grok-1",
  },
  {
    name: "Grok Beta",
    provider: "xAI",
    model_id: "xai/grok-beta",
  },
  // Others (only keeping high-quality models)
  // DeepSeek Models
  {
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    model_id: "deepseek/deepseek-chat",
  },
  {
    name: "DeepSeek Coder",
    provider: "DeepSeek",
    model_id: "deepseek/deepseek-coder",
  },
  // Llama 3.1 Models
  {
    name: "Llama 3.1 405B",
    provider: "Meta",
    model_id: "meta-llama/llama-3.1-405b-instruct",
  },
  {
    name: "Llama 3.1 70B",
    provider: "Meta",
    model_id: "meta-llama/llama-3.1-70b-instruct",
  },
  {
    name: "Llama 3.1 8B",
    provider: "Meta",
    model_id: "meta-llama/llama-3.1-8b-instruct",
  },
  // Mixtral Models
  {
    name: "Mixtral 8x22B",
    provider: "Mistral",
    model_id: "mistralai/mixtral-8x22b-instruct",
  },
  {
    name: "Mixtral 8x7B",
    provider: "Mistral",
    model_id: "mistralai/mixtral-8x7b-instruct",
  },
  // Claude Models via OpenRouter
  {
    name: "Claude Opus 4 (OpenRouter)",
    provider: "Anthropic",
    model_id: "anthropic/claude-opus-4",
  },
  {
    name: "Claude Sonnet 4 (OpenRouter)",
    provider: "Anthropic",
    model_id: "anthropic/claude-sonnet-4",
  },
  {
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    model_id: "anthropic/claude-3.5-sonnet",
  },
  {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    model_id: "anthropic/claude-3-opus",
  },
  // GPT Models via OpenRouter
  {
    name: "GPT-4o",
    provider: "OpenAI",
    model_id: "openai/gpt-4o",
  },
  {
    name: "GPT-4o Mini",
    provider: "OpenAI",
    model_id: "openai/gpt-4o-mini",
  },
];

// HuggingFace Models - VERIFIED WORKING MODELS (2025)
// Note: HuggingFace now requires tokens with "Make calls to Inference Providers" scope
// These models work with the legacy api-inference.huggingface.co endpoint
export const huggingfaceModels: ValidatorModel[] = [
  // Working models - tested and confirmed with legacy endpoint
  {
    name: "Phi-3 Mini 4K Instruct",
    provider: "HuggingFace",
    model_id: "microsoft/Phi-3-mini-4k-instruct",
  },
  {
    name: "Zephyr 7B Beta",
    provider: "HuggingFace",
    model_id: "HuggingFaceH4/zephyr-7b-beta",
  },
  // Note: Most models including Llama, Mistral, GPT-2 are NOT available on the free tier
  // The router.huggingface.co endpoint returns 404 for all tested models
  // For better model availability, consider using OpenRouter or dedicated Inference Endpoints
];

// Combine all models
export const allValidatorModels: ValidatorModel[] = [
  ...openaiModels,
  ...anthropicModels,
  ...googleModels,
  ...openRouterModels,
  ...huggingfaceModels,
];

// Helper function to get models by provider
export function getModelsByProvider(provider: string): ValidatorModel[] {
  return allValidatorModels.filter(model => model.provider === provider);
}

// Helper function to add custom models
export function createCustomModel(
  name: string,
  provider: string,
  modelId: string,
  url?: string
): ValidatorModel {
  return {
    name,
    provider,
    model_id: modelId,
    url,
  };
}
