"use client";

import { LLM, useLLMStore } from "@/store/llm-store";
import { StarIcon } from "lucide-react";
import clsx from "clsx";

interface Props {
  llm: LLM;
}

// Provider colors removed as they're not currently used

// Map LLM providers to local logo files
const providerLogos: Record<string, string> = {
  OpenAI: 'chatgpt.png',
  Anthropic: 'claude.png',
  Google: 'gemini.png',
  Grok: 'grok.png',
  OpenRouter: 'qwen.png',
  HuggingFace: 'zephyr.png',
  Custom: 'verafy-logo.png',
};

export default function LLMTile({ llm }: Props) {
  const { toggleLLM, pinLLM, unpinLLM } = useLLMStore();

  // Use provider color for avatar/visual indicator if needed later

  return (
    <div
      className={clsx(
        "relative flex flex-col items-center p-3 rounded-xl transition-all cursor-pointer select-none border-2",
        llm.enabled
          ? "border-emerald-500/80 bg-emerald-950/90 hover:bg-emerald-950 shadow-lg shadow-emerald-600/20"
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
      <p className="text-center text-sm font-medium mb-1 text-zinc-200">
        {llm.name}
      </p>
      
      {/* Model path/ID */}
      <p className="text-[10px] text-center text-zinc-400 mb-2 truncate w-full">
        {llm.id.includes('/') ? llm.id : llm.id.substring(0, 8)}
      </p>

      {/* Avatar or provider initial */}
      <div className="flex-1 flex items-center justify-center py-2">
        {/* Provider logo */}
        <img
          src={`/icons/${providerLogos[llm.provider] || providerLogos.Custom}`}
          alt={llm.provider}
          className="w-10 h-10 object-contain"
        />
      </div>

      {/* percentage */}
      <p className="text-xs text-zinc-400 mt-1">
        0%
      </p>
    </div>
  );
}
