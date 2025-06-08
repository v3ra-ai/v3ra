import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Provider =
  | "OpenAI"
  | "Anthropic"
  | "OpenRouter"
  | "HuggingFace"
  | "Custom"
  | string; // Allow profile names as providers

export interface LLM {
  id: string;
  name: string;
  provider: Provider;
  enabled: boolean;
  avatar?: string | null;
  pinned?: boolean;
  createdByUser?: boolean;
  usage?: number;
}

export interface Profile {
  name: string;
  llmIds: string[];
}

// Define precise type for server validators
interface Validator {
  id: string | number;
  modelName?: string;
  profileName?: string;
  provider?: string;
  active?: boolean;
  avatarUrl?: string | null;
}

interface LLMState {
  llms: LLM[];
  activeProvider: Provider | "All";
  search: string;
  sort: "name" | "provider";
  hasMore: boolean;
  showPinned: boolean;
  profiles: Profile[];
  fetchBatch: () => void;
  init: (initial: LLM[]) => void;
  fetchAll: () => Promise<void>;
  toggleLLM: (id: string) => void;
  setProvider: (provider: Provider | "All") => void;
  setSearch: (q: string) => void;
  setSort: (s: "name" | "provider") => void;
  pinLLM: (id: string) => void;
  unpinLLM: (id: string) => void;
  addProfile: (profile: Profile) => void;
  deleteProfile: (profileName: string) => void;
  toggleShowPinned: () => void;
  clearAllEnabled: () => void;
}

export const useLLMStore = create<LLMState>()(
  persist(
    (set, get) => ({
      llms: [],
      activeProvider: "All",
      search: "",
      sort: "name",
      hasMore: false,
      showPinned: false,
      profiles: [],

      fetchBatch: () => {
        console.log("Fetching next batch of LLMs");
        set({ hasMore: false });
      },

      init: (initial) => set({ llms: initial }),

      async fetchAll() {
        try {
          const res = await fetch("/api/validators");
          const data = await res.json();
          const mapped: LLM[] = data.map((v: Validator) => {
            let modelName = v.modelName || "";
            if (modelName === "gpt-40") {
              console.warn(
                `[llm-store] Found outdated model name 'gpt-40', replacing with 'gpt-4o'. Please update database.`,
              );
              modelName = "gpt-4o";
            }

            return {
              id: String(v.id),
              name: v.profileName || modelName || "Unnamed",
              provider: (v.provider || "Custom") as Provider,
              enabled: v.active ?? true,
              avatar: v.avatarUrl ?? null,
            };
          });
          set({ llms: mapped });
        } catch (err) {
          console.error("[llm-store] fetchAll error", err);
        }
      },

      toggleLLM: async (id) => {
        const prev = get().llms;
        set({
          llms: prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l)),
        });
        try {
          const target = prev.find((l) => l.id === id);
          if (!target) return;
          await fetch(`/api/validators/${id}/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: !target.enabled }),
          });
        } catch (err) {
          console.error("[llm-store] toggle backend error", err);
        }
      },

      setProvider: (provider) => set({ activeProvider: provider }),
      setSearch: (q) => set({ search: q }),
      setSort: (s) => set({ sort: s }),

      pinLLM: (id) =>
        set((state) => ({
          llms: state.llms.map((l) => (l.id === id ? { ...l, pinned: true } : l)),
        })),
      unpinLLM: (id) =>
        set((state) => ({
          llms: state.llms.map((l) => (l.id === id ? { ...l, pinned: false } : l)),
        })),

      addProfile: (profile) =>
        set((state) => {
          const newProfiles = [...state.profiles, profile];
          // Update LLMs to use the profile name as provider
          const updatedLLMs = state.llms.map((llm) =>
            profile.llmIds.includes(llm.id)
              ? { ...llm, provider: profile.name, createdByUser: true }
              : llm,
          );
          return { profiles: newProfiles, llms: updatedLLMs };
        }),

      deleteProfile: (profileName) =>
        set((state) => {
          // Remove profile from profiles
          const newProfiles = state.profiles.filter((p) => p.name !== profileName);
          // Revert LLMs with this provider to Custom
          const updatedLLMs = state.llms.map((llm) =>
            llm.provider === profileName
              ? { ...llm, provider: "Custom", createdByUser: false }
              : llm,
          );
          // Reset activeProvider if it was the deleted profile
          const newActiveProvider =
            state.activeProvider === profileName ? "All" : state.activeProvider;
          return {
            profiles: newProfiles,
            llms: updatedLLMs,
            activeProvider: newActiveProvider,
          };
        }),

      toggleShowPinned: () => set((state) => ({ showPinned: !state.showPinned })),

      clearAllEnabled: () =>
        set((state) => ({
          llms: state.llms.map((llm) => ({ ...llm, enabled: false })),
        })),
    }),
    {
      name: "llm-store",
      partialize: (state) => ({
        llms: state.llms,
        profiles: state.profiles,
      }),
    },
  ),
);