"use client";

import { useEffect, useState } from "react";
import { useLLMStore, LLM, Provider } from "@/store/llm-store";
import ProviderTabs from "./provider-tabs";
import LLMGrid from "./llm-grid";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";

// Define precise type for server validators
interface Validator {
  id: string | number;
  modelName?: string;
  profileName?: string;
  provider?: string;
  active?: boolean;
  avatarUrl?: string | null;
  publicKey?: string;
  isLeader?: boolean;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Props {
  initial: Validator[];
}

export default function ManageLLMsClient({ initial }: Props) {
  const init = useLLMStore((s) => s.init);
  const search = useLLMStore((s) => s.search);
  const setSearch = useLLMStore((s) => s.setSearch);
  const llms = useLLMStore((s) => s.llms);
  const toggleLLM = useLLMStore((s) => s.toggleLLM);
  const addProfile = useLLMStore((s) => s.addProfile);
  const showPinned = useLLMStore((s) => s.showPinned);
  const toggleShowPinned = useLLMStore((s) => s.toggleShowPinned);
  const clearAllEnabled = useLLMStore((s) => s.clearAllEnabled);
  const categories = useLLMStore((s) => s.categories);
  const activeCategory = useLLMStore((s) => s.activeCategory);
  const setCategory = useLLMStore((s) => s.setCategory);

  // State for profile name input
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    const mapped: LLM[] = initial.map((v) => {
      const modelName = typeof v.modelName === "string" ? v.modelName : "";
      const cleanedModelName = modelName === "gpt-40" ? "gpt-4o" : modelName;

      if (modelName === "gpt-40") {
        console.warn(
          `[ManageLLMs] Found outdated model name 'gpt-40', replacing with 'gpt-4o'. Please update database.`,
        );
      }

      const id = String(v.id || "");
      let profileName = typeof v.profileName === "string" ? v.profileName : "";
      const providerName = typeof v.provider === "string" ? v.provider : "Custom";
      const active = typeof v.active === "boolean" ? v.active : true;
      const avatarUrl = typeof v.avatarUrl === "string" ? v.avatarUrl : null;

      if (profileName.includes(" Validator")) {
        profileName = profileName.replace(" Validator", "");
      }

      const llm = {
        id: id,
        name: profileName || cleanedModelName || "Unnamed",
        provider: providerName as Provider,
        enabled: active,
        avatar: avatarUrl,
      };
      return llm;
    });
    console.log("[ManageLLMs] Initial validators:", initial);
    console.log("[ManageLLMs] Mapped LLMs:", mapped);
    init(mapped);
  }, [initial, init]);

  // Get enabled LLMs for tags
  const enabledLLMs = llms.filter((llm) => llm.enabled);

  // Handle profile creation
  const handleCreateProfile = () => {
    if (!profileName.trim()) {
      console.warn("[ManageLLMs] Profile name is required");
      return;
    }
    if (enabledLLMs.length === 0) {
      console.warn("[ManageLLMs] At least one LLM must be selected");
      return;
    }
    const profile = {
      name: profileName,
      llmIds: enabledLLMs.map((llm) => llm.id),
    };
    addProfile(profile);
    console.log("[ManageLLMs] Created profile", profile);
    setProfileName("");
    // Keep LLMs enabled for further editing
  };

  return (
    <main className="h-[100dvh] flex flex-col p-4 gap-4">
      <h1 className="text-2xl font-semibold">Manage LLMs</h1>
      <ProviderTabs />
      <input
        type="text"
        placeholder="Search models…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1 bg-background"
      />
      {/* Filter toggles */}
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
        {categories.map((category) => (
          <motion.button
            key={category.name}
            onClick={() => setCategory(category.name)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === category.name
                ? "bg-amber-600 text-white"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            }`}
            animate={{ scale: activeCategory === category.name ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {category.name}
          </motion.button>
        ))}
      </div>
      {/* Tags for enabled LLMs with Clear All button */}
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
      {/* Profile creation form */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Profile name…"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          className="flex-1 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1 bg-background"
        />
        <button
          onClick={handleCreateProfile}
          className="bg-emerald-600 text-white px-4 py-1 rounded-md hover:bg-emerald-700 transition-colors"
        >
          Create
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <LLMGrid />
      </div>
    </main>
  );
}