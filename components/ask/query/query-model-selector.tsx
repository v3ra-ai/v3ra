"use client";

import { useLLMStore } from "@/store/llm-store";
import { Zap, Layers, Settings } from "lucide-react";

// Simple keyword matching for model selection
const FAST_MODELS = ["gpt-3.5", "turbo", "mini", "fast", "mistral", "mixtral"];
const DIVERSE_MODELS = ["gpt-4", "claude", "opus", "sonnet", "llama", "gemini"];

export function QueryModelSelector() {
  const llms = useLLMStore((s) => s.llms);
  const setEnabledLLMs = useLLMStore((s) => s.setEnabledLLMs);

  const selectFastModels = () => {
    const fastModels = llms
      .filter((llm) =>
        FAST_MODELS.some((keyword) =>
          llm.name.toLowerCase().includes(keyword)
        )
      )
      .slice(0, 3)
      .map((llm) => llm.id);
    
    setEnabledLLMs(fastModels);
  };

  const selectDiverseModels = () => {
    const diverseModels = llms
      .filter((llm) =>
        DIVERSE_MODELS.some((keyword) =>
          llm.name.toLowerCase().includes(keyword)
        )
      )
      .slice(0, 5)
      .map((llm) => llm.id);
    
    setEnabledLLMs(diverseModels);
  };

  const selectAllModels = () => {
    setEnabledLLMs(llms.map((llm) => llm.id));
  };

  return (
    <div className="flex justify-center items-center gap-1 text-sm">
      <button
        onClick={selectFastModels}
        className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/50 hover:border-cyan-500/20 border border-transparent rounded-md transition-all duration-200"
      >
        <Zap className="w-3.5 h-3.5" />
        Fast (3)
      </button>
      <span className="text-zinc-700 px-2">•</span>
      <button
        onClick={selectDiverseModels}
        className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/50 hover:border-cyan-500/20 border border-transparent rounded-md transition-all duration-200"
      >
        <Layers className="w-3.5 h-3.5" />
        Balanced (5)
      </button>
      <span className="text-zinc-700 px-2">•</span>
      <button
        onClick={selectAllModels}
        className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/50 hover:border-cyan-500/20 border border-transparent rounded-md transition-all duration-200"
      >
        <Settings className="w-3.5 h-3.5" />
        Custom
      </button>
    </div>
  );
}