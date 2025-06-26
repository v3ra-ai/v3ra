import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LLM {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  avatar?: string | null;
}

interface LLMStore {
  llms: LLM[];
  initialized: boolean;
  
  // Actions
  toggleLLM: (id: string) => void;
  setEnabledLLMs: (ids: string[]) => void;
  fetchAll: () => Promise<void>;
  init: () => void;
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      llms: [],
      initialized: false,

      toggleLLM: (id: string) => {
        set((state) => ({
          llms: state.llms.map((llm) =>
            llm.id === id ? { ...llm, enabled: !llm.enabled } : llm
          ),
        }));
      },

      setEnabledLLMs: (ids: string[]) => {
        set((state) => ({
          llms: state.llms.map((llm) => ({
            ...llm,
            enabled: ids.includes(llm.id),
          })),
        }));
      },

      fetchAll: async () => {
        try {
          const response = await fetch("/api/validators/active");
          if (!response.ok) throw new Error("Failed to fetch validators");
          
          const validators = await response.json();
          
          const llmData: LLM[] = validators.map((v: any) => ({
            id: v.id,
            name: v.profileName || v.name,
            provider: v.provider,
            enabled: true, // Enable all by default
            avatar: v.avatarUrl,
          }));

          set({ llms: llmData, initialized: true });
        } catch (error) {
          console.error("Error fetching validators:", error);
        }
      },

      init: () => {
        const { initialized } = get();
        if (!initialized) {
          get().fetchAll();
        }
      },
    }),
    {
      name: "llm-storage",
      partialize: (state) => ({ 
        llms: state.llms.map(llm => ({ id: llm.id, enabled: llm.enabled }))
      }),
    }
  )
);