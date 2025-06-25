"use client";

import { useEffect, useRef } from "react";
import { useLLMStore, LLM, Provider } from "@/store/llm-store";
import ProviderTabs from "./provider-tabs";
import LLMGrid from "./llm-grid";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { useQueryStore } from "@/store/query-store";
import { Validator } from "@/lib/types";

interface Props {
  initial: Validator[];
  onClose?: () => void;
}

export default function ManageLLMsClient({ initial, onClose }: Props) {
  const init = useLLMStore((s) => s.init);
  const search = useLLMStore((s) => s.search);
  const setSearch = useLLMStore((s) => s.setSearch);
  const llms = useLLMStore((s) => s.llms);
  const toggleLLM = useLLMStore((s) => s.toggleLLM);
  const showPinned = useLLMStore((s) => s.showPinned);
  const toggleShowPinned = useLLMStore((s) => s.toggleShowPinned);
  const clearAllEnabled = useLLMStore((s) => s.clearAllEnabled);
  // const _categories = useLLMStore((s) => s.categories);
  // const _activeCategory = useLLMStore((s) => s.activeCategory);
  // const _setCategory = useLLMStore((s) => s.setCategory);
  const { setQueriesRequested } = useQueryStore();

  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once to prevent infinite loops
    if (initializedRef.current) return;

    const uniqueValidators = Array.from(
      new Map(initial.map((v) => [String(v.id), v])).values(),
    );
    console.log("[ManageLLMs] Deduplicated validators:", uniqueValidators.length);

    if (uniqueValidators.length > 0) {
      const mapped: LLM[] = uniqueValidators.map((v, index) => {
        const modelName = typeof v.modelName === "string" ? v.modelName : "";
        const cleanedModelName = modelName === "gpt-40" ? "gpt-4o" : modelName;

        if (modelName === "gpt-40") {
          console.warn(
            `[ManageLLMs] Found outdated model name 'gpt-40', replacing with 'gpt-4o'.`,
          );
        }

        const id = String(v.id || "");
        let profileName = typeof v.profileName === "string" ? v.profileName : "";
        const providerName = typeof v.provider === "string" ? v.provider : "Custom";
        const existingLLM = llms.find((l) => l.id === id);

        if (profileName.includes(" Validator")) {
          profileName = profileName.replace(" Validator", "");
        }

        // Enable the first 3 validators by default
        const isDefaultEnabled = index < 3;

        return {
          id,
          name: profileName || cleanedModelName || "Unnamed",
          provider: providerName as Provider,
          enabled: existingLLM?.enabled ?? isDefaultEnabled,
          avatar: v.avatarUrl ?? null,
        };
      });
      console.log("[ManageLLMs] Initial validators:", initial);
      console.log("[ManageLLMs] Mapped LLMs:", mapped);
      init(mapped);
      initializedRef.current = true;
    }
  }, [initial, init, llms]);

  useEffect(() => {
    console.log("[ManageLLMs] Store llms after init:", llms);
  }, [llms]);

  const enabledLLMs = llms.filter((llm) => llm.enabled);
  const selectedCount = enabledLLMs.length;

  const handleChoose = () => {
    console.log("[ManageLLMs] Choose button clicked, closing modal", { selectedCount });
    setQueriesRequested(selectedCount > 0 ? selectedCount : 4, 100); // Sync queriesRequested
    if (onClose) {
      onClose();
    }
  };

  const chooseButtonText = selectedCount > 0
    ? `Choose ${selectedCount} AIs Selected For Query`
    : "Please Select AIs Below";
  const chooseButtonClass = selectedCount > 0
    ? "bg-blue-600 text-white cursor-pointer px-4 py-1 rounded-md hover:bg-blue-700 transition-colors"
    : "bg-zinc-600 text-white cursor-pointer px-4 py-1 rounded-md hover:bg-zinc-700 transition-colors";

  return (
    <main className="h-[100dvh] flex flex-col p-4 gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">AI Validators</h1>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
        >
          ← Back to Ask
        </button>
      </div>
      
      {/* Helper text for new users */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Quick Start:</strong> Click &quot;Free Models&quot; to see models you can test without API keys, 
          or &quot;Popular&quot; to see the top 5 most-used AI models. Select validators by clicking on them, 
          then click &quot;Choose X AIs Selected&quot; at the bottom.
        </p>
      </div>
      
      <ProviderTabs />
      <input
        type="text"
        placeholder="Search models…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1 bg-background"
      />
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <motion.button
          onClick={toggleShowPinned}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            showPinned
              ? "bg-amber-500 text-white"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
          }`}
          animate={{ scale: showPinned ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Star className="size-4" />
          Show Pinned
        </motion.button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <AnimatePresence>
          {enabledLLMs.map((llm) => (
            <motion.span
              key={llm.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1 bg-emerald-600 text-white text-sm px-2 py-1 rounded-full"
            >
              {llm.name}
              <button
                onClick={() => toggleLLM(llm.id)}
                className="hover:bg-emerald-700 rounded-full p-0.5"
              >
                <X className="size-4" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {enabledLLMs.length > 0 && (
          <button
            onClick={clearAllEnabled}
            className="bg-red-600 text-white text-sm px-3 py-1 rounded-full hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleChoose}
          className={chooseButtonClass}
        >
          {chooseButtonText}
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <LLMGrid />
      </div>
    </main>
  );
}