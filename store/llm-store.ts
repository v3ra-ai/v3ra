import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useQueryStore } from "./query-store";

export type Provider =
  | "OpenAI"
  | "Anthropic"
  | "Google"
  | "OpenRouter"
  | "HuggingFace"
  | "Custom"
  | "Free Models"
  | "Popular"
  | string;

export interface LLM {
  id: string;
  name: string;
  provider: Provider;
  enabled: boolean;
  avatar?: string | null;
  pinned?: boolean;
  createdByUser?: boolean;
  usage?: number;
  isWorking?: boolean;
}

export interface Profile {
  name: string;
  llmIds: string[];
}

export interface Category {
  name: string;
  models: { validatorId: string; name: string }[];
}

interface Validator {
  id: string | number;
  modelName?: string;
  profileName?: string;
  provider?: string;
  active?: boolean;
  avatarUrl?: string | null;
  publicKey: string;
  isLeader: boolean;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  validatorType: string;
  reliability: number;
  totalVotes: number;
  correctVotes: number;
}

interface LLMState {
  llms: LLM[];
  activeProvider: Provider | "All";
  search: string;
  sort: "name" | "provider";
  hasMore: boolean;
  showPinned: boolean;
  profiles: Profile[];
  categories: Category[];
  activeCategory: string | null;
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
  setCategory: (category: string | null) => void;
  getSelectedLLMIds: () => string[];
  selectLLMsForPreset: (llmIds: string[]) => void;
  resetStore: () => void;
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
      categories: [],
      activeCategory: null,

      fetchBatch: () => {
        console.log("Fetching next batch of LLMs");
        set({ hasMore: false });
      },

      init: (initial) => {
        console.log("[llm-store] Initializing LLMs:", initial);
        set({ llms: initial });
      },

      async fetchAll() {
        try {
          const res = await fetch("/api/validators");
          const data = await res.json();
          const mapped: LLM[] = data.map((v: Validator) => {
            let modelName = v.modelName || "";
            if (modelName === "gpt-40") {
              console.warn(
                `[llm-store] Found outdated model name 'gpt-40', replacing with 'gpt-4o'.`,
              );
              modelName = "gpt-4o";
            }

            return {
              id: String(v.id),
              name: v.profileName || modelName || "Unnamed",
              provider: (v.provider || "Custom") as Provider,
              enabled: v.active ?? false,
              avatar: v.avatarUrl ?? null,
            };
          });
          console.log("[llm-store] Fetched and mapped LLMs:", mapped);
          set({ llms: mapped });
        } catch {
          console.error("[llm-store] fetchAll error");
        }
      },

      toggleLLM: async (id) => {
        const prev = get().llms;
        const updatedLLMs = prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l));
        set({ llms: updatedLLMs });

        const selectedLLMIds = updatedLLMs.filter((l) => l.enabled).map((l) => l.id);
        const setSelectedLLMIds = useQueryStore.getState().setSelectedLLMIds;
        setSelectedLLMIds(selectedLLMIds);
        console.log("[llm-store] Toggled LLM:", id, "Enabled:", !prev.find((l) => l.id === id)?.enabled);

        try {
          const target = prev.find((l) => l.id === id);
          if (!target) return;
          await fetch(`/api/validators/${id}/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: !target.enabled }),
          });
        } catch {
          console.error("[llm-store] toggle backend error");
        }
      },

      setProvider: (provider) => {
        console.log("[llm-store] Setting activeProvider to:", provider);
        set({ activeProvider: provider });
      },
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
          const updatedLLMs = state.llms.map((llm) =>
            profile.llmIds.includes(llm.id)
              ? { ...llm, provider: profile.name, createdByUser: true }
              : llm,
          );
          return { profiles: newProfiles, llms: updatedLLMs };
        }),

      deleteProfile: (profileName) =>
        set((state) => {
          const newProfiles = state.profiles.filter((p) => p.name !== profileName);
          const profile = state.profiles.find((p) => p.name === profileName);
          const updatedLLMs = state.llms.map((llm) =>
            profile?.llmIds.includes(llm.id)
              ? { ...llm, provider: "Custom", createdByUser: false, enabled: false }
              : llm,
          );
          const newActiveProvider =
            state.activeProvider === profileName ? "All" : state.activeProvider;
          const selectedLLMIds = updatedLLMs.filter((l) => l.enabled).map((l) => l.id);
          useQueryStore.getState().setSelectedLLMIds(selectedLLMIds);
          console.log("[llm-store] Deleted profile:", profileName, "Updated LLMs:", updatedLLMs);
          return {
            profiles: newProfiles,
            llms: updatedLLMs,
            activeProvider: newActiveProvider,
          };
        }),

      toggleShowPinned: () => set((state) => ({ showPinned: !state.showPinned })),

      clearAllEnabled: () =>
        set((state) => {
          const updatedLLMs = state.llms.map((llm) => ({ ...llm, enabled: false }));
          useQueryStore.getState().setSelectedLLMIds([]);
          console.log("[llm-store] Cleared all enabled LLMs:", updatedLLMs);
          return { llms: updatedLLMs };
        }),

      setCategory: (category) =>
        set((state) => ({
          activeCategory: state.activeCategory === category ? null : category,
          showPinned: false,
          activeProvider: "All",
        })),

      getSelectedLLMIds: () => get().llms.filter((l) => l.enabled).map((l) => l.id),

      selectLLMsForPreset: (llmIds: string[]) => {
        set((state) => {
          const updatedLLMs = state.llms.map((llm) => ({
            ...llm,
            enabled: llmIds.includes(llm.id)
          }));
          useQueryStore.getState().setSelectedLLMIds(llmIds);
          console.log("[llm-store] Selected LLMs for preset:", llmIds);
          return { llms: updatedLLMs };
        });
      },

      resetStore: () => {
        console.log("[llm-store] Resetting store");
        set({
          llms: [],
          profiles: [],
          activeProvider: "All",
          search: "",
          sort: "name",
          hasMore: false,
          showPinned: false,
          activeCategory: null,
        });
      },
    }),
    {
      name: "llm-store",
      partialize: (state) => ({
        llms: state.llms, // Persist the entire llms array, including enabled state
        profiles: state.profiles,
      }),
    },
  ),
);