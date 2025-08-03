import { create } from "zustand";

/**
 * Global store for Large Language Model (LLM) data and state.
 * Currently minimal – expand as features grow.
 */
interface LLMStore {
  /** Whether the store has performed its one-time client initialisation. */
  initialized: boolean;
  /** One-time initialisation run by <LLMProvider>. */
  init: () => void;

  /** List of LLM model IDs available to the app (e.g. "gpt-4o", "llama-3"). */
  availableModels: string[];
  setAvailableModels: (models: string[]) => void;
}

export const useLLMStore = create<LLMStore>((set) => ({
  initialized: false,
  availableModels: [],

  init: () => set({ initialized: true }),

  setAvailableModels: (models) => set({ availableModels: models }),
}));
