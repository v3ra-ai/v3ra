import { create } from "zustand";
import type { VoteResult } from "@/lib/types";
import {
  USER_FREE_CREDITS_DEFAULT,
  USER_PAID_CREDITS_DEFAULT,
  QUERIES_REQUESTED_DEFAULT,
  USER_CREDIT_CONVERSION_DEFAULT,
  QUERIES_COST_EACH_DEFAULT,
} from "@/lib/constants";

// Helper function to calculate derived query states
const calculateQueriesState = (queriesRequested: number, creditsTotal: number, costEach: number) => ({
  queriesUnpaid: queriesRequested - creditsTotal,
  queriesCostTotal: Math.max(0, queriesRequested - creditsTotal) * costEach,
});

// Export VoteResult from lib/types
export type { VoteResult };

export type QueryMode = "factCheck" | "predict" | "create" | "shop";
export type ViewMode = "viewStandard" | "viewExpert";

export interface QueryStore {
  userFreeCredits: number;
  userPaidCredits: number;
  userCreditsTotal: number;
  queriesRequested: number;
  queriesUnpaid: number;
  queriesCostEach: number;
  queriesCostTotal: number;
  userCreditConversion: number;
  queryMode: QueryMode;
  viewMode: ViewMode;
  voteHistory: VoteResult[];
  lastVoteResult: VoteResult | null;
  decrementFreeCredits: (amount: number) => void;
  decrementPaidCredits: (amount: number) => void;
  incrementPaidCredits: (amount: number) => void;
  setQueriesRequested: (amount: number) => void;
  setQueryMode: (mode: QueryMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setVoteHistory: (history: VoteResult[] | ((prev: VoteResult[]) => VoteResult[])) => void;
  setLastVoteResult: (result: VoteResult | null | ((prev: VoteResult | null) => VoteResult | null)) => void;
  resetAfterSubmission: () => void;
  decrementQueries: (amount: number) => void;
  incrementQueries: (amount: number) => void;
  setUserAiQueryAmountRequested: (amount: number) => void;
  resetCreditsAfterPayment: () => void;
}

export const useQueryStore = create<QueryStore>((set) => ({
  // State: User credits and query counts
  userFreeCredits: USER_FREE_CREDITS_DEFAULT,
  userPaidCredits: USER_PAID_CREDITS_DEFAULT,
  userCreditsTotal: USER_FREE_CREDITS_DEFAULT + USER_PAID_CREDITS_DEFAULT,
  queriesRequested: QUERIES_REQUESTED_DEFAULT,
  queriesUnpaid: QUERIES_REQUESTED_DEFAULT - (USER_FREE_CREDITS_DEFAULT + USER_PAID_CREDITS_DEFAULT),
  queriesCostEach: QUERIES_COST_EACH_DEFAULT,
  queriesCostTotal: Math.max(0, QUERIES_REQUESTED_DEFAULT - (USER_FREE_CREDITS_DEFAULT + USER_PAID_CREDITS_DEFAULT)) * QUERIES_COST_EACH_DEFAULT,
  userCreditConversion: USER_CREDIT_CONVERSION_DEFAULT,

  // State: Query modes and vote history
  queryMode: "factCheck",
  viewMode: "viewExpert",
  voteHistory: [],
  lastVoteResult: null,

  // Actions: Credit management
  decrementFreeCredits: (amount: number) => set((state) => {
    const newFreeCredits = Math.max(0, state.userFreeCredits - amount);
    const newCreditsTotal = newFreeCredits + state.userPaidCredits;
    return {
      userFreeCredits: newFreeCredits,
      userCreditsTotal: newCreditsTotal,
      ...calculateQueriesState(state.queriesRequested, newCreditsTotal, state.queriesCostEach),
    };
  }),

  decrementPaidCredits: (amount: number) => set((state) => {
    const newPaidCredits = Math.max(0, state.userPaidCredits - amount);
    const newCreditsTotal = state.userFreeCredits + newPaidCredits;
    return {
      userPaidCredits: newPaidCredits,
      userCreditsTotal: newCreditsTotal,
      ...calculateQueriesState(state.queriesRequested, newCreditsTotal, state.queriesCostEach),
    };
  }),

  incrementPaidCredits: (amount: number) => set((state) => {
    const newPaidCredits = state.userPaidCredits + amount;
    const newCreditsTotal = state.userFreeCredits + newPaidCredits;
    return {
      userPaidCredits: newPaidCredits,
      userCreditsTotal: newCreditsTotal,
      ...calculateQueriesState(state.queriesRequested, newCreditsTotal, state.queriesCostEach),
    };
  }),

  // Actions: Query management
  setQueriesRequested: (amount: number) => set((state) => ({
    queriesRequested: amount,
    ...calculateQueriesState(amount, state.userCreditsTotal, state.queriesCostEach),
  })),

  setQueryMode: (mode: QueryMode) => set(() => ({ queryMode: mode })),

  setViewMode: (mode: ViewMode) => set(() => ({ viewMode: mode })),

  // Actions: Vote history management
  setVoteHistory: (history) => set((state) => ({
    voteHistory: typeof history === "function" ? history(state.voteHistory) : history,
  })),

  setLastVoteResult: (result) => set((state) => ({
    lastVoteResult: typeof result === "function" ? result(state.lastVoteResult) : result,
  })),

  // Actions: Reset and query adjustments
  resetAfterSubmission: () => set((state) => {
    const remainingCredits = Math.max(0, state.userCreditsTotal - state.queriesRequested);
    const freeCredits = Math.min(remainingCredits, state.userFreeCredits);
    const paidCredits = remainingCredits - freeCredits;
    const newCreditsTotal = freeCredits + paidCredits;
    return {
      userFreeCredits: freeCredits,
      userPaidCredits: paidCredits,
      userCreditsTotal: newCreditsTotal,
      queriesRequested: QUERIES_REQUESTED_DEFAULT,
      ...calculateQueriesState(QUERIES_REQUESTED_DEFAULT, newCreditsTotal, state.queriesCostEach),
    };
  }),

  decrementQueries: (amount: number) => set((state) => {
    const freeAmount = Math.min(amount, state.userFreeCredits);
    const paidAmount = amount - freeAmount;
    const newFreeCredits = Math.max(0, state.userFreeCredits - freeAmount);
    const newPaidCredits = Math.max(0, state.userPaidCredits - paidAmount);
    const newCreditsTotal = newFreeCredits + newPaidCredits;
    return {
      userFreeCredits: newFreeCredits,
      userPaidCredits: newPaidCredits,
      userCreditsTotal: newCreditsTotal,
      ...calculateQueriesState(state.queriesRequested, newCreditsTotal, state.queriesCostEach),
    };
  }),

  incrementQueries: (amount: number) => set((state) => {
    const newPaidCredits = state.userPaidCredits + amount;
    const newCreditsTotal = state.userFreeCredits + newPaidCredits;
    return {
      userPaidCredits: newPaidCredits,
      userCreditsTotal: newCreditsTotal,
      ...calculateQueriesState(state.queriesRequested, newCreditsTotal, state.queriesCostEach),
    };
  }),

  setUserAiQueryAmountRequested: (amount: number) => set((state) => ({
    queriesRequested: amount,
    ...calculateQueriesState(amount, state.userCreditsTotal, state.queriesCostEach),
  })),

  resetCreditsAfterPayment: () => set((state) => ({
    userFreeCredits: 0,
    userPaidCredits: 0,
    userCreditsTotal: 0,
    queriesUnpaid: state.queriesRequested,
    queriesCostTotal: state.queriesRequested * state.queriesCostEach,
  })),
}));
