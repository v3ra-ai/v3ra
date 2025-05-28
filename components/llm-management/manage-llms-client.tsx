"use client";

import { useEffect } from "react";
import { useLLMStore, LLM, Provider } from "@/store/llm-store";
import ProviderTabs from "./provider-tabs";
import LLMGrid from "./llm-grid";

interface Props {
  initial: any[]; // raw validators from server (DB)
}

export default function ManageLLMsClient({ initial }: Props) {
  const init = useLLMStore((s) => s.init);
  const search = useLLMStore((s) => s.search);
  const setSearch = useLLMStore((s) => s.setSearch);

  // Map server validators to LLM objects once on mount
  useEffect(() => {
    // Map server validators to LLMs, handle gpt-40 special case
    const mapped: LLM[] = initial.map((v) => {
      let modelName = v.modelName;
      if (modelName === 'gpt-40') {
        console.warn(`[ManageLLMs] Found outdated model name 'gpt-40', replacing with 'gpt-4o'. Please update database.`);
        modelName = 'gpt-4o';
      }
      return {
        id: v.id,
        name: v.profileName || modelName || "Unnamed",
        provider: (v.provider || "Custom") as Provider,
        enabled: v.active ?? true,
        avatar: v.avatarUrl ?? null,
      };
    });
    console.log("[ManageLLMs] initial mapped", mapped.length);
    init(mapped);
    // Remove client fetchAll to preserve initial data and avoid flicker
  }, [initial, init]);

  return (
    <main className="h-[100dvh] flex flex-col p-4 gap-4">
      <h1 className="text-2xl font-semibold">Manage LLMs</h1>
      <ProviderTabs />
      <input
        type="text"
        placeholder="Search models…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1 bg-background mb-2"
      />
      <div className="flex-1 min-h-0">
        <LLMGrid />
      </div>
    </main>
  );
}
