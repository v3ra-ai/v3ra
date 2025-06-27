"use client";

import { useLLMStore } from "@/store/llm-store";
import { Bot, CheckCircle } from "lucide-react";

interface SelectedModelsDisplayProps {
  hide?: boolean;
}

export function SelectedModelsDisplay({ hide = false }: SelectedModelsDisplayProps) {
  const llms = useLLMStore((s) => s.llms);
  const enabledLLMs = llms.filter((llm) => llm.enabled);

  if (enabledLLMs.length === 0 || hide) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
      <div className="flex items-center gap-2 mb-2">
        <Bot className="w-4 h-4 text-cyan-400" />
        <span className="text-sm text-zinc-400">
          {enabledLLMs.length} AI{enabledLLMs.length !== 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {enabledLLMs.slice(0, 5).map((llm) => (
          <div
            key={llm.id}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/10 text-cyan-300 text-xs rounded-full border border-cyan-500/20"
          >
            <CheckCircle className="w-3 h-3" />
            <span>{llm.name?.replace(' Validator', '') || 'Unknown Model'}</span>
          </div>
        ))}
        {enabledLLMs.length > 5 && (
          <div className="px-2.5 py-1 text-zinc-500 text-xs">
            +{enabledLLMs.length - 5} more
          </div>
        )}
      </div>
    </div>
  );
}