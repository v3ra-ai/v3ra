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
  pinned?: boolean;
  createdByUser?: boolean;
  usage?: number;
}

interface LLMState {
  llms: LLM[];
  activeProvider: Provider | "All";
  init: (initial: LLM[]) => void;
  toggleLLM: (id: string) => void;
  setProvider: (provider: Provider | "All") => void;
  pinLLM: (id: string) => void;
  unpinLLM: (id: string) => void;
}

export const useLLMStore = create<LLMState>()(
  persist(
    (set) => ({
      llms: [],
      activeProvider: "All",

      init: (initial) => set({ llms: initial }),

      toggleLLM: (id) =>
        set((state) => ({
          llms: state.llms.map((l) =>
            l.id === id ? { ...l, enabled: !l.enabled } : l,
          ),
        })),

      setProvider: (provider) => set({ activeProvider: provider }),

      pinLLM: (id) =>
        set((state) => ({
          llms: state.llms.map((l) =>
            l.id === id ? { ...l, pinned: true } : l,
          ),
        })),

      unpinLLM: (id) =>
        set((state) => ({
          llms: state.llms.map((l) =>
            l.id === id ? { ...l, pinned: false } : l,
          ),
        })),
    }),
    {
      name: "llm-store", // persisted key
      partialize: (state) => ({ llms: state.llms }), // only persist llm list
    },
  ),
);
