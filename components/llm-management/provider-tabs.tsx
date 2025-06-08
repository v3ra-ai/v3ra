"use client";

import { Provider, useLLMStore } from "@/store/llm-store";
import clsx from "clsx";
import { X } from "lucide-react";

// Define a proper type for the provider list including 'All' and profiles
type ProviderTab = Provider | "All";

export default function ProviderTabs() {
  const { activeProvider, setProvider, profiles, deleteProfile } = useLLMStore();

  // Combine static providers with profile names
  const staticProviders: ProviderTab[] = [
    "All",
    "OpenAI",
    "Anthropic",
    "OpenRouter",
    "HuggingFace",
    "Custom",
  ];
  const profileProviders: ProviderTab[] = profiles.map((p) => p.name);
  const providers = [...staticProviders, ...profileProviders];

  const handleDeleteProfile = (profileName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent setting provider when deleting
    if (confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
      deleteProfile(profileName);
    }
  };

  const handleSetProvider = (provider: ProviderTab) => {
    setProvider(provider);
    console.log("[ProviderTabs] Set activeProvider to:", provider);
  };

  return (
    <div className="flex w-full overflow-x-auto no-scrollbar gap-2 py-2 px-1 sm:px-0">
      {providers.map((p) => (
        <div key={p} className="flex items-center gap-1">
          <button
            onClick={() => handleSetProvider(p)}
            className={clsx(
              "whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeProvider === p
                ? "bg-emerald-600 text-white dark:bg-emerald-500"
                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600",
            )}
          >
            {p}
          </button>
          {profileProviders.includes(p) && (
            <button
              onClick={(e) => handleDeleteProfile(p, e)}
              className="text-red-500 hover:text-red-600 p-1"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}