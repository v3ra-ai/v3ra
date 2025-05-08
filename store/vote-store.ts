
import { create } from "zustand";
import { VoteResult } from "@/lib/types";

// Log to confirm store initialization
console.log("[vote-store] Initializing store");

interface VoteStore {
  voteHistory: VoteResult[];
  lastVoteResult: VoteResult | null;
  voteSessionCount: number;
  lastVoteSessionCountCheck: number | null; // Timestamp (ms) of last count check
  setVoteHistory: (history: VoteResult[] | ((prev: VoteResult[]) => VoteResult[])) => void;
  setLastVoteResult: (result: VoteResult | null | ((prev: VoteResult | null) => VoteResult | null)) => void;
  setVoteSessionCount: (count: number) => void;
}

export const useVoteStore = create<VoteStore>((set) => ({
  voteHistory: [],
  lastVoteResult: null,
  voteSessionCount: 0,
  lastVoteSessionCountCheck: null,

  setVoteHistory: (history) => {
    console.log(
      "[vote-store] Setting voteHistory:",
      typeof history === "function" ? "function" : `${history.length} items`
    );
    set((state) => ({
      voteHistory: typeof history === "function" ? history(state.voteHistory) : history,
    }));
  },

  setLastVoteResult: (result) => {
    console.log(
      "[vote-store] Setting lastVoteResult:",
      typeof result === "function" ? "function" : result ? result.id : null
    );
    set((state) => ({
      lastVoteResult: typeof result === "function" ? result(state.lastVoteResult) : result,
    }));
  },

  setVoteSessionCount: (count) => {
    console.log("[vote-store] Setting voteSessionCount:", count);
    set(() => ({
      voteSessionCount: count,
      lastVoteSessionCountCheck: Date.now(),
    }));
  },
}));