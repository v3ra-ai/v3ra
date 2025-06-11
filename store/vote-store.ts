
import { create } from "zustand";
import { VoteResult } from "@/lib/types";

// Log to confirm store initialization
console.log("[vote-store] Initializing store");

interface VoteStore {
  voteHistory: VoteResult[];
  lastVoteResult: VoteResult | null;
  voteSessionCount: number;
  lastVoteSessionCountCheck: number | null; // Timestamp (ms) of last count check
  isLoadingMore: boolean;
  hasMore: boolean;
  offset: number;
  setVoteHistory: (history: VoteResult[] | ((prev: VoteResult[]) => VoteResult[])) => void;
  appendVoteHistory: (history: VoteResult[]) => void;
  setLastVoteResult: (result: VoteResult | null | ((prev: VoteResult | null) => VoteResult | null)) => void;
  setVoteSessionCount: (count: number) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setOffset: (offset: number) => void;
  resetPagination: () => void;
}

export const useVoteStore = create<VoteStore>((set) => ({
  voteHistory: [],
  lastVoteResult: null,
  voteSessionCount: 0,
  lastVoteSessionCountCheck: null,
  isLoadingMore: false,
  hasMore: true,
  offset: 0,

  setVoteHistory: (history) => {
    console.log(
      "[vote-store] Setting voteHistory:",
      typeof history === "function" ? "function" : `${history.length} items`
    );
    set((state) => ({
      voteHistory: typeof history === "function" ? history(state.voteHistory) : history,
    }));
  },

  appendVoteHistory: (history) => {
    console.log("[vote-store] Appending voteHistory:", `${history.length} items`);
    set((state) => ({
      voteHistory: [...state.voteHistory, ...history],
      offset: state.offset + history.length,
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

  setIsLoadingMore: (loading) => {
    console.log("[vote-store] Setting isLoadingMore:", loading);
    set(() => ({ isLoadingMore: loading }));
  },

  setHasMore: (hasMore) => {
    console.log("[vote-store] Setting hasMore:", hasMore);
    set(() => ({ hasMore }));
  },

  setOffset: (offset) => {
    console.log("[vote-store] Setting offset:", offset);
    set(() => ({ offset }));
  },

  resetPagination: () => {
    console.log("[vote-store] Resetting pagination");
    set(() => ({
      offset: 0,
      hasMore: true,
      isLoadingMore: false,
    }));
  },
}));