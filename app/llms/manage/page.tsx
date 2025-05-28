"use client";

import { useLLMStore } from "@/store/llm-store";
import ProviderTabs from "@/components/llm-management/provider-tabs";
import LLMGrid from "@/components/llm-management/llm-grid";
import { useEffect } from "react";

export default function ManageLLMsPage() {
  const init = useLLMStore((s) => s.init);

  // Mock initial data; replace with server fetch later
  useEffect(() => {
    const mock = Array.from({ length: 120 }).map((_, i) => ({
      id: `m-${i}`,
      name: i % 3 === 0 ? `GPT-4o-${i}` : i % 3 === 1 ? `Claude-${i}` : `Mistral-${i}`,
      provider: i % 3 === 0 ? "OpenAI" : i % 3 === 1 ? "Anthropic" : "HuggingFace",
      enabled: Math.random() > 0.4,
    }));
    init(mock as any);
  }, [init]);

  return (
    <main className="min-h-screen flex flex-col p-4 gap-4">
      <h1 className="text-2xl font-semibold">Manage LLMs</h1>
      <ProviderTabs />
      <div className="flex-1 min-h-0">
        <LLMGrid />
      </div>
    </main>
  );
}
