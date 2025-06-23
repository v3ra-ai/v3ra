import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TokenState {
  tokens: number;
  earnedThisSession: number;
  spentThisSession: number;
  isLoading: boolean;
  
  // Actions
  initializeTokens: () => void;
  spendTokens: (amount: number) => boolean;
  earnToken: () => void;
  resetSession: () => void;
}

const DEFAULT_TOKENS = 50;

export const useTokenStore = create<TokenState>()(
  persist(
    (set, get) => ({
      tokens: DEFAULT_TOKENS,
      earnedThisSession: 0,
      spentThisSession: 0,
      isLoading: false,

      initializeTokens: () => {
        const storedTokens = localStorage.getItem("user-tokens");
        if (storedTokens) {
          const tokens = parseInt(storedTokens);
          set({ tokens: isNaN(tokens) ? DEFAULT_TOKENS : tokens });
        } else {
          // New user gets default tokens
          localStorage.setItem("user-tokens", DEFAULT_TOKENS.toString());
          set({ tokens: DEFAULT_TOKENS });
        }
      },

      spendTokens: (amount: number) => {
        const currentTokens = get().tokens;
        if (currentTokens < amount) {
          console.log("[token-store] Insufficient tokens:", { required: amount, available: currentTokens });
          return false;
        }

        const newTokens = currentTokens - amount;
        localStorage.setItem("user-tokens", newTokens.toString());
        
        set(state => ({
          tokens: newTokens,
          spentThisSession: state.spentThisSession + amount
        }));

        console.log("[token-store] Tokens spent:", { amount, remaining: newTokens });
        return true;
      },

      earnToken: () => {
        set(state => {
          const newTokens = state.tokens + 1;
          localStorage.setItem("user-tokens", newTokens.toString());
          
          console.log("[token-store] Token earned:", { total: newTokens });
          
          return {
            tokens: newTokens,
            earnedThisSession: state.earnedThisSession + 1
          };
        });
      },

      resetSession: () => {
        set({
          earnedThisSession: 0,
          spentThisSession: 0
        });
      }
    }),
    {
      name: "token-store",
      partialize: (state) => ({ tokens: state.tokens }) // Only persist tokens
    }
  )
);