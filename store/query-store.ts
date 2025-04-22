import { create } from "zustand";
import type { VoteResult } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";

export type QueryMode = "factCheck" | "predict" | "create" | "shop";
export type ViewMode = "viewStandard" | "viewExpert";

// For testing, default to viewExpert; change to viewStandard later
const DEFAULT_VIEW_MODE: ViewMode = "viewExpert";

export interface QueryStore {
  totalQueries: number;
  queryMode: QueryMode;
  viewMode: ViewMode;
  voteHistory: VoteResult[];
  lastVoteResult: VoteResult | null;
  userAiQueryAmountRequested: number;
  decrementQueries: (amount: number) => void;
  incrementQueries: (amount: number) => void;
  setQueryMode: (mode: QueryMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setVoteHistory: Dispatch<SetStateAction<VoteResult[]>>;
  setLastVoteResult: Dispatch<SetStateAction<VoteResult | null>>;
  setUserAiQueryAmountRequested: (amount: number) => void;
}

export const useQueryStore = create<QueryStore>((set) => ({
  totalQueries: 10,
  queryMode: "factCheck",
  viewMode: DEFAULT_VIEW_MODE,
  voteHistory: [],
  lastVoteResult: null,
  userAiQueryAmountRequested: 4, // Matches INITIAL_AI_QUERY_AMOUNT_REQUESTED
  decrementQueries: (amount: number) =>
    set((state) => ({
      totalQueries: Math.max(0, state.totalQueries - amount),
    })),
  incrementQueries: (amount: number) =>
    set((state) => ({
      totalQueries: state.totalQueries + amount,
    })),
  setQueryMode: (mode: QueryMode) =>
    set(() => ({
      queryMode: mode,
    })),
  setViewMode: (mode: ViewMode) =>
    set(() => ({
      viewMode: mode,
    })),
  setVoteHistory: (history: VoteResult[] | ((prev: VoteResult[]) => VoteResult[])) =>
    set((state) => ({
      voteHistory: typeof history === "function" ? history(state.voteHistory) : history,
    })),
  setLastVoteResult: (result: VoteResult | null | ((prev: VoteResult | null) => VoteResult | null)) =>
    set((state) => ({
      lastVoteResult: typeof result === "function" ? result(state.lastVoteResult) : result,
    })),
  setUserAiQueryAmountRequested: (amount: number) =>
    set(() => ({
      userAiQueryAmountRequested: amount,
    })),
}));