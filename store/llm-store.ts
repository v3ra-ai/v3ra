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
  customSelection: string[]; // Store custom selection
  
  // Actions
  toggleLLM: (id: string) => void;
  setEnabledLLMs: (ids: string[]) => void;
  fetchAll: () => Promise<void>;
  init: () => void;
  setCustomSelection: (ids: string[]) => Promise<void>;
  loadCustomSelection: () => Promise<void>;
}

export const useLLMStore = create<LLMStore>()(
  persist(
    (set, get) => ({
      llms: [],
      initialized: false,
      customSelection: [],

      toggleLLM: (id: string) => {
        set((state) => ({
          llms: state.llms.map((llm) =>
            llm.id === id ? { ...llm, enabled: !llm.enabled } : llm
          ),
        }));
        
        // Update custom selection when toggling
        const updatedLLMs = get().llms;
        const enabledIds = updatedLLMs.filter(llm => llm.enabled).map(llm => llm.id);
        set({ customSelection: enabledIds });
      },

      setEnabledLLMs: (ids: string[]) => {
        set((state) => ({
          llms: state.llms.map((llm) => ({
            ...llm,
            enabled: ids.includes(llm.id),
          })),
          customSelection: ids,
        }));
      },

      fetchAll: async () => {
        try {
          // Fetch first page with a higher limit to get most validators
          const response = await fetch("/api/validators/active?page=1&limit=100");
          if (!response.ok) throw new Error("Failed to fetch validators");
          
          const data = await response.json();
          const validators = data.validators || data; // Handle both old and new API formats
          
          const { customSelection } = get();
          
          const llmData: LLM[] = validators.map((v: any) => ({
            id: v.id,
            name: v.profileName || v.name,
            provider: v.provider,
            enabled: customSelection.includes(v.id), // Only enable if in custom selection
            avatar: v.avatarUrl,
          }));

          set({ llms: llmData, initialized: true });
        } catch (error) {
          // Error fetching validators
        }
      },

      init: () => {
        const { initialized } = get();
        if (!initialized) {
          get().fetchAll();
        }
      },

      setCustomSelection: async (ids: string[]) => {
        set({ customSelection: ids });
        // Also update the enabled state of LLMs
        set((state) => ({
          llms: state.llms.map((llm) => ({
            ...llm,
            enabled: ids.includes(llm.id),
          })),
        }));
        
        // Save to database if user is logged in
        try {
          // Get CSRF token
          const csrfResponse = await fetch('/api/csrf-token');
          const { token: csrfToken } = await csrfResponse.json();
          
          await fetch('/api/user/custom-llms', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({ customLLMSelection: ids }),
            credentials: 'include'
          });
        } catch (error) {
          // Failed to save custom LLM selection
        }
      },

      loadCustomSelection: async () => {
        const state = get();
        // Prevent multiple calls
        if (state.initialized && state.llms.some(llm => llm.enabled)) {
          return; // Already loaded
        }
        
        try {
          // First try to load from database
          const response = await fetch('/api/user/custom-llms');
          if (response.ok) {
            const data = await response.json();
            if (data.customLLMSelection && data.customLLMSelection.length > 0) {
              set({ customSelection: data.customLLMSelection });
              set((state) => ({
                llms: state.llms.map((llm) => ({
                  ...llm,
                  enabled: data.customLLMSelection.includes(llm.id),
                })),
              }));
              return;
            }
          }
        } catch (error) {
          // Fall back to local storage
          // Failed to load custom LLM selection from server
        }
        
        // Fall back to local storage
        const { customSelection } = get();
        if (customSelection.length > 0) {
          set((state) => ({
            llms: state.llms.map((llm) => ({
              ...llm,
              enabled: customSelection.includes(llm.id),
            })),
          }));
        }
      },
    }),
    {
      name: "llm-storage",
      partialize: (state) => ({ 
        llms: state.llms.map(llm => ({ id: llm.id, enabled: llm.enabled })),
        customSelection: state.customSelection
      }),
    }
  )
);