import { create } from "zustand";
import { DEFAULTS, QueryMode, ViewMode } from "@/lib/types";

interface QueryStore {
  queriesRequested: number;
  queriesUnpaid: number;
  queriesCostEach: number;
  queriesCostTotal: number;
  userCreditConversion: number;
  queryMode: QueryMode;
  viewMode: ViewMode;
  setQueriesRequested: (amount: number, creditsTotal: number) => void;
  setQueryMode: (mode: QueryMode) => void;
  setViewMode: (mode: ViewMode) => void;
  decrementQueries: (amount: number, creditsTotal: number) => void;
  incrementQueries: (amount: number, creditsTotal: number) => void;
  setUserAiQueryAmountRequested: (amount: number, creditsTotal: number) => void;
  resetAfterSubmission: (creditsTotal: number) => void;
}

// Helper function to calculate derived query states
const calculateQueriesState = (queriesRequested: number, creditsTotal: number, costEach: number) => ({
  queriesUnpaid: queriesRequested - creditsTotal,
  queriesCostTotal: Math.max(0, queriesRequested - creditsTotal) * costEach,
});

export const useQueryStore = create<QueryStore>((set) => ({
  queriesRequested: DEFAULTS.QUERIES_REQUESTED,
  queriesUnpaid: DEFAULTS.QUERIES_REQUESTED - (DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS),
  queriesCostEach: DEFAULTS.QUERIES_COST_EACH,
  queriesCostTotal: Math.max(0, DEFAULTS.QUERIES_REQUESTED - (DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS)) * DEFAULTS.QUERIES_COST_EACH,
  userCreditConversion: DEFAULTS.USER_CREDIT_CONVERSION,
  queryMode: "factCheck",
  viewMode: "viewExpert",

  setQueriesRequested: (amount: number, creditsTotal: number) => set(() => ({
    queriesRequested: amount,
    ...calculateQueriesState(amount, creditsTotal, DEFAULTS.QUERIES_COST_EACH),
  })),

  setQueryMode: (mode: QueryMode) => set(() => ({ queryMode: mode })),

  setViewMode: (mode: ViewMode) => set(() => ({ viewMode: mode })),

  decrementQueries: (amount: number, creditsTotal: number) => set((state) => ({
    ...calculateQueriesState(state.queriesRequested, creditsTotal, state.queriesCostEach),
  })),

  incrementQueries: (amount: number, creditsTotal: number) => set((state) => ({
    ...calculateQueriesState(state.queriesRequested, creditsTotal, state.queriesCostEach),
  })),

  setUserAiQueryAmountRequested: (amount: number, creditsTotal: number) => set(() => ({
    queriesRequested: amount,
    ...calculateQueriesState(amount, creditsTotal, DEFAULTS.QUERIES_COST_EACH),
  })),

  resetAfterSubmission: (creditsTotal: number) => set(() => ({
    queriesRequested: DEFAULTS.QUERIES_REQUESTED,
    ...calculateQueriesState(DEFAULTS.QUERIES_REQUESTED, creditsTotal, DEFAULTS.QUERIES_COST_EACH),
  })),
}));