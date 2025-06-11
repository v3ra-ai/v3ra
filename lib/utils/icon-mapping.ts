/**
 * Unified icon mapping system for LLM/Validator avatars
 * This ensures consistent icon display across all pages
 */

export interface IconMapping {
  modelName: string;
  provider: string;
  iconPath: string;
}

/**
 * Get the icon path for a given model name and provider
 * This is the single source of truth for all LLM/Validator icons
 */
export function getModelIconPath(
  modelName: string,
  provider: string,
  avatarUrl?: string | null
): string {
  // If avatarUrl is provided from database, use it
  if (avatarUrl) {
    // Ensure the path is correct format
    if (avatarUrl.startsWith('/')) {
      return avatarUrl;
    }
    // If it's just the filename, prepend the icons directory
    return `/icons/${avatarUrl}`;
  }

  // Otherwise, use model name matching
  const modelNameLower = modelName.toLowerCase();

  // OpenAI models
  if (
    modelNameLower.includes("gpt-4") ||
    modelNameLower.includes("gpt-3.5") ||
    modelNameLower.includes("openai") ||
    modelNameLower.includes("gpt-40") // Handle legacy gpt-40 naming
  ) {
    return "/icons/chatgpt.png";
  }

  // Anthropic models
  if (modelNameLower.includes("claude")) {
    return "/icons/claude.png";
  }

  // Google models
  if (modelNameLower.includes("gemini")) {
    return "/icons/gemini.png";
  }

  // Meta/Llama models
  if (
    modelNameLower.includes("llama") ||
    modelNameLower.includes("meta-llama") ||
    modelNameLower.includes("meta/llama") ||
    modelNameLower.includes("meta ")
  ) {
    return "/icons/metallama.png";
  }

  // DeepSeek models
  if (modelNameLower.includes("deepseek")) {
    return "/icons/deepseek.png";
  }

  // Qwen models (Alibaba)
  if (modelNameLower.includes("qwen")) {
    return "/icons/qwen.png";
  }

  // Grok models (xAI)
  if (modelNameLower.includes("grok")) {
    return "/icons/grok.png";
  }

  // Mistral and Mixtral models
  if (modelNameLower.includes("mistral") || modelNameLower.includes("mixtral")) {
    return "/icons/mistral.png";
  }

  // Zephyr models
  if (modelNameLower.includes("zephyr")) {
    return "/icons/zephyr.png";
  }

  // Perplexity models
  if (modelNameLower.includes("perplexity")) {
    return "/icons/perplexity.png";
  }

  // Hugging Face models
  if (modelNameLower.includes("huggingface") || modelNameLower.startsWith("hf/")) {
    return "/icons/huggingface.png";
  }

  // Falcon models
  if (modelNameLower.includes("falcon")) {
    return "/icons/falcon.png";
  }

  // Stability AI models
  if (
    modelNameLower.includes("stability") ||
    modelNameLower.includes("stable") ||
    modelNameLower.includes("stablecode")
  ) {
    return "/icons/stable.webp";
  }

  // Cohere models
  if (modelNameLower.includes("cohere") || modelNameLower.includes("command")) {
    return "/icons/cohere.svg";
  }

  // Bloom models
  if (modelNameLower.includes("bloom")) {
    return "/icons/bloom.webp";
  }

  // Wizard models
  if (modelNameLower.includes("wizard")) {
    return "/icons/wizard.png";
  }

  // Yi models
  if (modelNameLower.includes("yi-")) {
    return "/icons/yi.svg";
  }

  // Provider-based fallback
  const providerLower = provider.toLowerCase();
  
  if (providerLower.includes("openai")) {
    return "/icons/chatgpt.png";
  }
  
  if (providerLower.includes("anthropic")) {
    return "/icons/claude.png";
  }
  
  if (providerLower.includes("google")) {
    return "/icons/gemini.png";
  }
  
  if (providerLower.includes("grok") || providerLower.includes("xai")) {
    return "/icons/grok.png";
  }
  
  if (providerLower.includes("openrouter")) {
    return "/icons/openrouter.svg";
  }
  
  if (providerLower.includes("huggingface")) {
    return "/icons/huggingface.png";
  }

  // Default fallback
  return "/icons/truth.png"; // Using truth.png as default instead of placeholder
}

/**
 * Legacy support for validator image mapping
 * This maintains backward compatibility with existing validatorImageMapping.json
 */
export function getValidatorIcon(
  validatorId: string, 
  validatorData?: {
    modelName?: string;
    profileName?: string;
    provider?: string;
    avatarUrl?: string | null;
  }
): string {
  // Try to get from validatorData first
  if (validatorData) {
    return getModelIconPath(
      validatorData.modelName || validatorData.profileName || "",
      validatorData.provider || "",
      validatorData.avatarUrl
    );
  }
  
  // Fallback to default
  return "/icons/truth.png";
}