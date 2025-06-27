
import { create } from "zustand";
import { VoteResult } from "@/lib/types";

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
    set((state) => ({
      voteHistory: typeof history === "function" ? history(state.voteHistory) : history,
    }));
  },

  appendVoteHistory: (history) => {
    set((state) => ({
      voteHistory: [...state.voteHistory, ...history],
      offset: state.offset + history.length,
    }));
  },

  setLastVoteResult: (result) => {
    set((state) => ({
      lastVoteResult: typeof result === "function" ? result(state.lastVoteResult) : result,
    }));
  },

  setVoteSessionCount: (count) => {
    set(() => ({
      voteSessionCount: count,
      lastVoteSessionCountCheck: Date.now(),
    }));
  },

  setIsLoadingMore: (loading) => {
    set(() => ({ isLoadingMore: loading }));
  },

  setHasMore: (hasMore) => {
    set(() => ({ hasMore }));
  },

  setOffset: (offset) => {
    set(() => ({ offset }));
  },

  resetPagination: () => {
    set(() => ({
      offset: 0,
      hasMore: true,
      isLoadingMore: false,
    }));
  },
}));