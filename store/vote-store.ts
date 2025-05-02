import { create } from "zustand";
import { VoteResult } from "@/lib/types";

interface VoteStore {
  voteHistory: VoteResult[];
  lastVoteResult: VoteResult | null;
  setVoteHistory: (history: VoteResult[] | ((prev: VoteResult[]) => VoteResult[])) => void;
  setLastVoteResult: (result: VoteResult | null | ((prev: VoteResult | null) => VoteResult | null)) => void;
}

export const useVoteStore = create<VoteStore>((set) => ({
  voteHistory: [],
  lastVoteResult: null,

  setVoteHistory: (history) => set((state) => ({
    voteHistory: typeof history === "function" ? history(state.voteHistory) : history,
  })),

  setLastVoteResult: (result) => set((state) => ({
    lastVoteResult: typeof result === "function" ? result(state.lastVoteResult) : result,
  })),
}));