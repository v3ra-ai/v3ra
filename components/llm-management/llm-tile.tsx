"use client";

import { LLM, useLLMStore } from "@/store/llm-store";
import { Switch } from "@/components/ui/switch";
import { StarIcon } from "lucide-react";
import clsx from "clsx";

interface Props {
  llm: LLM;
}

const providerColors: Record<string, string> = {
  OpenAI: "bg-emerald-600",
  Anthropic: "bg-orange-500",
  OpenRouter: "bg-blue-500",
  HuggingFace: "bg-yellow-500",
  Custom: "bg-zinc-500",
};

export default function LLMTile({ llm }: Props) {
  const { toggleLLM, pinLLM, unpinLLM } = useLLMStore();

  const color = providerColors[llm.provider] || "bg-zinc-400";

  return (
    <div
      className={clsx(
        "relative flex flex-col items-center justify-between p-3 rounded-xl shadow-sm border border-transparent transition-colors cursor-pointer",
        llm.enabled ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-50 dark:bg-zinc-900 opacity-60",
        llm.pinned && "ring-2 ring-amber-400",
      )}
      onClick={() => toggleLLM(llm.id)}
    >
      {/* Pin star */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          llm.pinned ? unpinLLM(llm.id) : pinLLM(llm.id);
        }}
        className="absolute top-2 right-2 text-amber-400 hover:scale-110 transition-transform"
      >
        <StarIcon
          className={clsx("size-4", { "fill-amber-400": llm.pinned, "stroke-amber-400": !llm.pinned })}
        />
      </button>

      {/* Provider indicator */}
      <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs", color)}>
        {llm.provider.slice(0, 2)}
      </div>

      {/* Name */}
      <p className="mt-2 text-center text-sm font-medium break-words leading-tight">
        {llm.name}
      </p>

      {/* Switch */}
      <Switch
        checked={llm.enabled}
        onCheckedChange={() => toggleLLM(llm.id)}
        className="mt-2"
      />
    </div>
  );
}
