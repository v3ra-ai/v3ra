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
    name: "Llama 2 70B Chat",
    provider: "Meta",
    model_id: "meta-llama/llama-2-70b-chat",
  },
  {
    name: "Llama 2 13B Chat",
    provider: "Meta",
    model_id: "meta-llama/llama-2-13b-chat",
  },
  {
    name: "Code Llama 34B",
    provider: "Meta",
    model_id: "codellama/codellama-34b-instruct",
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
  // WizardLM Models
  {
    name: "WizardLM 2 8x22B",
    provider: "WizardLM",
    model_id: "microsoft/wizardlm-2-8x22b",
  },
  {
    name: "WizardCoder 15B",
    provider: "WizardLM",
    model_id: "wizardlm/wizardcoder-15b",
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
  // Others
  {
    name: "Dolphin Mixtral 8x7B",
    provider: "Cognitive Computations",
    model_id: "cognitivecomputations/dolphin-mixtral-8x7b",
  },
  {
    name: "Yi 34B Chat",
    provider: "01-AI",
    model_id: "01-ai/yi-34b-chat",
  },
  {
    name: "Yi 6B",
    provider: "01-AI",
    model_id: "01-ai/yi-6b",
  },
  {
    name: "Toppy M 7B",
    provider: "Undi95",
    model_id: "undi95/toppy-m-7b",
  },
  {
    name: "MythoMax L2 13B",
    provider: "Gryphe",
    model_id: "gryphe/mythomax-l2-13b",
  },
];

// HuggingFace Models - Extended List
export const huggingfaceModels: ValidatorModel[] = [
  // Falcon Models
  {
    name: "Falcon 180B Chat",
    provider: "Hugging Face",
    model_id: "tiiuae/falcon-180B-chat",
    url: "https://api-inference.huggingface.co/models/tiiuae/falcon-180B-chat",
  },
  {
    name: "Falcon 40B Instruct",
    provider: "Hugging Face",
    model_id: "tiiuae/falcon-40b-instruct",
    url: "https://api-inference.huggingface.co/models/tiiuae/falcon-40b-instruct",
  },
  {
    name: "Falcon 7B Instruct",
    provider: "Hugging Face",
    model_id: "tiiuae/falcon-7b-instruct",
    url: "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
  },
  // StarCoder Models
  {
    name: "StarCoder",
    provider: "Hugging Face",
    model_id: "bigcode/starcoder",
    url: "https://api-inference.huggingface.co/models/bigcode/starcoder",
  },
  {
    name: "StarCoderBase",
    provider: "Hugging Face",
    model_id: "bigcode/starcoderbase",
    url: "https://api-inference.huggingface.co/models/bigcode/starcoderbase",
  },
  {
    name: "StarCoder2 15B",
    provider: "Hugging Face",
    model_id: "bigcode/starcoder2-15b",
    url: "https://api-inference.huggingface.co/models/bigcode/starcoder2-15b",
  },
  // BLOOM Models
  {
    name: "BLOOM 176B",
    provider: "Hugging Face",
    model_id: "bigscience/bloom",
    url: "https://api-inference.huggingface.co/models/bigscience/bloom",
  },
  {
    name: "BLOOMZ 7B",
    provider: "Hugging Face",
    model_id: "bigscience/bloomz-7b1",
    url: "https://api-inference.huggingface.co/models/bigscience/bloomz-7b1",
  },
  // Stable Models
  {
    name: "StableCode 3B",
    provider: "Stability AI",
    model_id: "stabilityai/stablecode-instruct-alpha-3b",
    url: "https://api-inference.huggingface.co/models/stabilityai/stablecode-instruct-alpha-3b",
  },
  {
    name: "StableLM 2 1.6B",
    provider: "Stability AI",
    model_id: "stabilityai/stablelm-2-1_6b-chat",
    url: "https://api-inference.huggingface.co/models/stabilityai/stablelm-2-1_6b-chat",
  },
  // EleutherAI Models
  {
    name: "GPT-J 6B",
    provider: "EleutherAI",
    model_id: "EleutherAI/gpt-j-6b",
    url: "https://api-inference.huggingface.co/models/EleutherAI/gpt-j-6b",
  },
  {
    name: "GPT-NeoX 20B",
    provider: "EleutherAI",
    model_id: "EleutherAI/gpt-neox-20b",
    url: "https://api-inference.huggingface.co/models/EleutherAI/gpt-neox-20b",
  },
  // Microsoft Models
  {
    name: "Phi-2",
    provider: "Microsoft",
    model_id: "microsoft/phi-2",
    url: "https://api-inference.huggingface.co/models/microsoft/phi-2",
  },
  {
    name: "DialoGPT Large",
    provider: "Microsoft",
    model_id: "microsoft/DialoGPT-large",
    url: "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
  },
  // Databricks Models
  {
    name: "Dolly v2 12B",
    provider: "Databricks",
    model_id: "databricks/dolly-v2-12b",
    url: "https://api-inference.huggingface.co/models/databricks/dolly-v2-12b",
  },
  {
    name: "Dolly v2 7B",
    provider: "Databricks",
    model_id: "databricks/dolly-v2-7b",
    url: "https://api-inference.huggingface.co/models/databricks/dolly-v2-7b",
  },
  // MPT Models
  {
    name: "MPT 30B Chat",
    provider: "MosaicML",
    model_id: "mosaicml/mpt-30b-chat",
    url: "https://api-inference.huggingface.co/models/mosaicml/mpt-30b-chat",
  },
  {
    name: "MPT 7B Chat",
    provider: "MosaicML",
    model_id: "mosaicml/mpt-7b-chat",
    url: "https://api-inference.huggingface.co/models/mosaicml/mpt-7b-chat",
  },
  // Other Notable Models
  {
    name: "Vicuna 13B v1.5",
    provider: "LMSys",
    model_id: "lmsys/vicuna-13b-v1.5",
    url: "https://api-inference.huggingface.co/models/lmsys/vicuna-13b-v1.5",
  },
  {
    name: "Alpaca 7B",
    provider: "Chavinlo",
    model_id: "chavinlo/alpaca-native",
    url: "https://api-inference.huggingface.co/models/chavinlo/alpaca-native",
  },
  {
    name: "OpenAssistant Pythia 12B",
    provider: "OpenAssistant",
    model_id: "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
    url: "https://api-inference.huggingface.co/models/OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
  },
  {
    name: "RedPajama 7B Chat",
    provider: "TogetherComputer",
    model_id: "togethercomputer/RedPajama-INCITE-7B-Chat",
    url: "https://api-inference.huggingface.co/models/togethercomputer/RedPajama-INCITE-7B-Chat",
  },
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
