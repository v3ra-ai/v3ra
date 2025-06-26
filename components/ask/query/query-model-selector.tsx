"use client";

import { Button } from "@/components/ui/button";
import { useLLMStore } from "@/store/llm-store";
import { Sparkles, Zap } from "lucide-react";

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
    <div className="flex flex-wrap gap-2 justify-center mt-4">
      <Button
        onClick={selectFastModels}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Zap className="h-4 w-4" />
        3 Fast Models
      </Button>
      <Button
        onClick={selectDiverseModels}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        5 Diverse Models
      </Button>
      <Button
        onClick={selectAllModels}
        variant="outline"
        size="sm"
      >
        All Models
      </Button>
    </div>
  );
}