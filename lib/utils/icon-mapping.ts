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
  if (modelNameLower.includes("yi ") || modelNameLower.includes("yi-") || modelNameLower.startsWith("yi")) {
    return "/icons/yi.svg";
  }

  // Phi models (Microsoft)
  if (modelNameLower.includes("phi-3") || modelNameLower.includes("phi3") || modelNameLower.includes("phi ")) {
    return "/icons/phi3.svg";
  }

  // Additional model name patterns
  // Nous Research models
  if (modelNameLower.includes("nous") || modelNameLower.includes("hermes") || modelNameLower.includes("capybara")) {
    return "/icons/huggingface.png"; // Using HF icon as fallback
  }

  // Intel models
  if (modelNameLower.includes("neural") && modelNameLower.includes("chat")) {
    return "/icons/chatgpt.png"; // Using generic chat icon
  }

  // OpenOrca models
  if (modelNameLower.includes("orca")) {
    return "/icons/mistral.png"; // Since it's OpenOrca Mistral
  }

  // Phind models
  if (modelNameLower.includes("phind")) {
    return "/icons/metallama.png"; // Since it's CodeLlama based
  }

  // Dolphin models
  if (modelNameLower.includes("dolphin")) {
    return "/icons/mistral.png"; // Since many are Mixtral based
  }

  // Toppy models
  if (modelNameLower.includes("toppy")) {
    return "/icons/huggingface.png"; // Community model
  }

  // MythoMax models
  if (modelNameLower.includes("mytho")) {
    return "/icons/huggingface.png"; // Community model
  }

  // Code models (generic)
  if (modelNameLower.includes("code") && !modelNameLower.includes("llama")) {
    return "/icons/chatgpt.png"; // Generic code model icon
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

  if (providerLower.includes("meta")) {
    return "/icons/metallama.png";
  }

  if (providerLower.includes("deepseek")) {
    return "/icons/deepseek.png";
  }

  if (providerLower.includes("qwen")) {
    return "/icons/qwen.png";
  }

  if (providerLower.includes("mistral")) {
    return "/icons/mistral.png";
  }

  if (providerLower.includes("perplexity")) {
    return "/icons/perplexity.png";
  }

  if (providerLower.includes("wizardlm")) {
    return "/icons/wizard.png";
  }

  if (providerLower.includes("zephyr")) {
    return "/icons/zephyr.png";
  }

  if (providerLower.includes("cohere")) {
    return "/icons/cohere.svg";
  }

  // Additional provider mappings
  if (providerLower.includes("nous")) {
    return "/icons/huggingface.png";
  }

  if (providerLower.includes("01-ai") || providerLower.includes("01.ai")) {
    return "/icons/yi.svg";
  }

  if (providerLower.includes("cognitive")) {
    return "/icons/huggingface.png";
  }

  if (providerLower.includes("intel")) {
    return "/icons/chatgpt.png";
  }

  if (providerLower.includes("phind")) {
    return "/icons/metallama.png";
  }

  if (providerLower.includes("microsoft")) {
    return "/icons/phi3.svg";
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