"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Validator } from "@/lib/types";
import { useValidatorManagementStore } from "@/store/validator-management-store";

// Helper function to map model names to their respective icons
function getModelIconPath(modelName: string, avatarUrl: string | null): string {
  const modelNameLower = modelName.toLowerCase();
  
  // Map for LLM models - OpenAI
  if (modelNameLower.includes('gpt-4') || modelNameLower.includes('gpt-3.5') || modelNameLower.includes('openai')) {
    return '/icons/chatgpt.png';
  }
  
  // Anthropic models
  if (modelNameLower.includes('claude')) {
    return '/icons/claude.png';
  }
  
  // Google models
  if (modelNameLower.includes('gemini')) {
    return '/icons/gemini.png';
  }
  
  // Meta models
  if (modelNameLower.includes('llama') || modelNameLower.includes('meta-llama') || modelNameLower.includes('meta/llama') || modelNameLower.includes('meta ')) {
    return '/icons/metallama.png';
  }
  
  // DeepSeek models
  if (modelNameLower.includes('deepseek')) {
    return '/icons/deepseek.png';
  }
  
  // Qwen models (Alibaba)
  if (modelNameLower.includes('qwen')) {
    return '/icons/qwen.png';
  }
  
  // Zephyr models - Map to Mistral since they're fine-tuned by Mistral
  if (modelNameLower.includes('zephyr')) {
    return '/icons/mistral.png';
  }
  
  // Grok models (xAI)
  if (modelNameLower.includes('grok')) {
    return '/icons/grok.png';
  }
  
  // Mistral and Mixtral models (Mixtral is a Mistral model)
  if (modelNameLower.includes('mistral') || modelNameLower.includes('mixtral')) {
    return '/icons/mistral.png';
  }
  
  // Perplexity models
  if (modelNameLower.includes('perplexity')) {
    return '/icons/perplexity.png';
  }
  
  // Hugging Face models
  if (modelNameLower.includes('huggingface') || modelNameLower.startsWith('hf/')) {
    return '/icons/huggingface.png';
  }
  
  // Falcon models
  if (modelNameLower.includes('falcon')) {
    return '/icons/falcon.png';
  }
  
  // Stability models and Stable Code
  if (modelNameLower.includes('stability') || modelNameLower.includes('stable code') || modelNameLower.includes('stablecode')) {
    return '/icons/stable.webp';
  }
  
  // Provider-based fallback if no model-specific icon
  if (avatarUrl) {
    return `/icons/${avatarUrl}`;
  }
  
  // Default fallback
  return '/icons/placeholder.png';
}

interface ValidatorTileProps {
  validator: Validator;
  active?: boolean; // Optional prop to override the internal active state
}

export default function ValidatorTile({ validator, active: activeFromProps }: ValidatorTileProps) {
  const { selectedIds, toggleValidator } = useValidatorManagementStore();

  // Use activeFromProps if provided, otherwise determine from selectedIds
  const active = activeFromProps !== undefined ? activeFromProps : selectedIds.includes(validator.id);

  const handleClick = () => {
    toggleValidator(validator.id);
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClick}
      className={clsx(
        "flex flex-col items-center justify-center rounded-lg shadow-md cursor-pointer select-none w-32 h-32 p-3 transition-colors",
        active
          ? "bg-emerald-600/20 ring-2 ring-emerald-500 dark:ring-emerald-400"
          : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      )}
    >
      <div className="w-full text-center text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
        {validator.profileName}
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate w-full text-center">
        {validator.modelName}
      </div>
      <Image
        src={getModelIconPath(validator.modelName, validator.avatarUrl)}
        alt={validator.profileName}
        width={32}
        height={32}
        className={clsx("object-contain", active ? "" : "grayscale")}
      />
      {validator.reliability !== null && (
        <span className="text-[10px] mt-0.5">
          {Math.round(validator.reliability)}%
        </span>
      )}
    </motion.div>
  );
}
