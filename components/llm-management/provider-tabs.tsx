"use client";

import { useLLMStore } from "@/store/llm-store";
import clsx from "clsx";

const providers: ("All" | "OpenAI" | "Anthropic" | "OpenRouter" | "HuggingFace" | "Custom")[] = [
  "All",
  "OpenAI",
  "Anthropic",
  "OpenRouter",
  "HuggingFace",
  "Custom",
];

export default function ProviderTabs() {
  const { activeProvider, setProvider } = useLLMStore();

  return (
    <div className="flex w-full overflow-x-auto no-scrollbar gap-2 py-2 px-1 sm:px-0">
      {providers.map((p) => (
        <button
          key={p}
          onClick={() => setProvider(p as any)}
          className={clsx(
            "whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            activeProvider === p
              ? "bg-emerald-600 text-white dark:bg-emerald-500"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
          )}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
