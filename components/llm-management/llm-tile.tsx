"use client";

import { LLM, useLLMStore } from "@/store/llm-store";
import { StarIcon } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";

interface Props {
  llm: LLM;
}

// Define specific interface for provider logos
interface ProviderLogo {
  OpenAI: string;
  Anthropic: string;
  Google: string;
  Grok: string;
  OpenRouter: string;
  HuggingFace: string;
  Custom: string;
}

// Helper function to map model names to their respective icons
function getModelIconPath(modelName: string, provider: string): string {
  const modelNameLower = modelName.toLowerCase();

  // Map for LLM models - OpenAI
  if (
    modelNameLower.includes("gpt-4") ||
    modelNameLower.includes("gpt-3.5") ||
    modelNameLower.includes("openai")
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

  // Meta models
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

  // Zephyr models - Map to Mistral since they're fine-tuned by Mistral
  if (modelNameLower.includes("zephyr")) {
    return "/icons/mistral.png";
  }

  // Grok models (xAI)
  if (modelNameLower.includes("grok")) {
    return "/icons/grok.png";
  }

  // Mistral and Mixtral models (Mixtral is a Mistral model)
  if (modelNameLower.includes("mistral") || modelNameLower.includes("mixtral")) {
    return "/icons/mistral.png";
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

  // Stability models and Stable Code
  if (
    modelNameLower.includes("stability") ||
    modelNameLower.includes("stable code") ||
    modelNameLower.includes("stablecode")
  ) {
    return "/icons/stable.webp";
  }

  // Provider-based fallback if no model-specific icon
  const providerLogos: ProviderLogo = {
    OpenAI: "chatgpt.png",
    Anthropic: "claude.png",
    Google: "gemini.png",
    Grok: "grok.png",
    OpenRouter: "qwen.png",
    HuggingFace: "huggingface.png",
    Custom: "verafy-logo.png",
  };

  const logoProvider = Object.keys(providerLogos).includes(provider) ? provider : "Custom";
  return `/icons/${providerLogos[logoProvider as keyof ProviderLogo]}`;
}

export default function LLMTile({ llm }: Props) {
  const { toggleLLM, pinLLM, unpinLLM } = useLLMStore();

  return (
    <div
      className={clsx(
        "relative flex flex-col items-center p-3 rounded-xl transition-all cursor-pointer select-none border-2",
        llm.enabled
          ? "border-emerald-600/80 bg-emerald-950/90 hover:bg-emerald-950 shadow-lg shadow-emerald-600/20"
          : "border-zinc-700/60 bg-zinc-900 opacity-60 hover:opacity-80",
        llm.pinned && "ring-2 ring-amber-400",
      )}
      onClick={() => toggleLLM(llm.id)}
    >
      {/* Pin star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (llm.pinned) {
            unpinLLM(llm.id);
          } else {
            pinLLM(llm.id);
          }
        }}
        className="absolute top-2 right-2 text-amber-400 hover:scale-110 transition-transform"
      >
        <StarIcon
          className={clsx("size-4", { "fill-amber-400": llm.pinned, "stroke-amber-400": !llm.pinned })}
        />
      </button>

      {/* Model name */}
      <p className="text-center text-sm font-medium mb-1 text-zinc-200">{llm.name}</p>

      {/* Model path/ID */}
      <p className="text-[10px] text-center text-zinc-400 mb-2 truncate w-full">
        {llm.id.includes("/") ? llm.id : llm.id.substring(0, 8)}
      </p>

      {/* Avatar or provider initial */}
      <div className="flex-1 flex items-center justify-center py-2">
        {/* Model-specific icon */}
        <div className="relative w-10 h-10">
          <Image
            src={getModelIconPath(llm.name, llm.provider)}
            alt={llm.name}
            fill
            className="object-contain"
            sizes="40px"
            priority={false}
          />
        </div>
      </div>

      {/* percentage */}
      <p className="text-xs text-zinc-400 mt-1">0%</p>
    </div>
  );
}