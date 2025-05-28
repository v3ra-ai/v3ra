import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Provider =
  | "OpenAI"
  | "Anthropic"
  | "OpenRouter"
  | "HuggingFace"
  | "Custom";

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

interface LLMState {
  llms: LLM[];
  activeProvider: Provider | "All";
  search: string;
  sort: "name" | "provider";
  hasMore: boolean;
  fetchBatch: () => void;
  init: (initial: LLM[]) => void;
  fetchAll: () => Promise<void>;
  toggleLLM: (id: string) => void;
  setProvider: (provider: Provider | "All") => void;
  setSearch: (q: string) => void;
  setSort: (s: "name" | "provider") => void;
  pinLLM: (id: string) => void;
  unpinLLM: (id: string) => void;
}

export const useLLMStore = create<LLMState>()(
  persist(
    (set, get) => ({
      llms: [],
      activeProvider: "All",
      search: "",
      sort: "name",
      hasMore: false,
      
      fetchBatch: () => {
        // Placeholder implementation for pagination - to be implemented
        console.log("Fetching next batch of LLMs");
        // For now, just mark that there are no more results
        set({ hasMore: false });
      },

      init: (initial) => set({ llms: initial }),

      async fetchAll() {
        try {
          const res = await fetch("/api/validators");
          const data = await res.json();
          const mapped: LLM[] = data.map((v: any) => {
            // Handle special case for gpt-40 (should be gpt-4o)
            let modelName = v.modelName;
            if (modelName === 'gpt-40') {
              console.warn(`[llm-store] Found outdated model name 'gpt-40', replacing with 'gpt-4o'. Please update database.`);
              modelName = 'gpt-4o';
            }
            
            return {
              id: v.id,
              name: v.profileName || modelName,
              provider: (v.provider || "Custom") as Provider,
              enabled: v.active,
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
    }),
    {
      name: "llm-store",
      partialize: (state) => ({ llms: state.llms, pinned: state.llms.filter((l)=>l.pinned) }),
    },
  ),
);
