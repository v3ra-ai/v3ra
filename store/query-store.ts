import { create } from "zustand";
import { DEFAULTS, QueryMode, ViewMode } from "@/lib/types";

console.log("[query-store] Initializing store");

interface QueryStore {
  queriesRequested: number;
  queriesUnpaid: number;
  queriesCostEach: number;
  queriesCostTotal: number;
  userCreditConversion: number;
  userCreditsTotal: number;
  queryMode: QueryMode;
  viewMode: ViewMode;
  selectedLLMIds: string[];
  setQueriesRequested: (amount: number, creditsTotal: number) => void;
  setQueryMode: (mode: QueryMode) => void;
  setViewMode: (mode: ViewMode) => void;
  decrementQueries: (amount: number, creditsTotal: number) => void;
  incrementQueries: (amount: number, creditsTotal: number) => void;
  setUserAiQueryAmountRequested: (amount: number, queriesTotal: number) => void;
  setSelectedLLMIds: (llmIds: string[]) => void;
  resetAfterSubmission: (creditsTotal: number) => void;
}

const calculateQueriesState = (
  queriesRequested: number,
  creditsTotal: number,
  costEach: number,
) => {
  const queriesUnpaid = Math.max(0, queriesRequested - creditsTotal);
  console.log("[query-store] Calculating queries state:", {
    queriesRequested,
    creditsTotal,
    queriesUnpaid,
    queriesCostTotal: queriesUnpaid * costEach,
  });
  return {
    queriesUnpaid,
    queriesCostTotal: queriesUnpaid * costEach,
  };
};

export const useQueryStore = create<QueryStore>((set) => {
  const initialState = {
    queriesRequested: DEFAULTS.QUERIES_REQUESTED,
    queriesUnpaid: Math.max(
      0,
      DEFAULTS.QUERIES_REQUESTED - (DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS),
    ),
    queriesCostEach: DEFAULTS.QUERIES_COST_EACH,
    queriesCostTotal:
      Math.max(
        0,
        DEFAULTS.QUERIES_REQUESTED - (DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS),
      ) * DEFAULTS.QUERIES_COST_EACH,
    userCreditConversion: DEFAULTS.USER_CREDIT_CONVERSION,
    userCreditsTotal: DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS,
    queryMode: "fact-check" as QueryMode,
    viewMode: "viewExpert" as ViewMode,
    selectedLLMIds: [],
  };
  console.log("[query-store] Initial state:", initialState);
  return {
    ...initialState,

    setQueriesRequested: (amount, creditsTotal) => {
      console.log("[query-store] Setting queriesRequested:", amount);
      set(() => ({
        queriesRequested: amount,
        ...calculateQueriesState(amount, creditsTotal, DEFAULTS.QUERIES_COST_EACH),
      }));
    },

    setQueryMode: (mode) => {
      console.log("[query-store] Setting queryMode:", mode);
      set(() => ({ queryMode: mode }));
    },

    setViewMode: (mode) => {
      console.log("[query-store] Setting viewMode:", mode);
      set(() => ({ viewMode: mode }));
    },

    decrementQueries: (amount, creditsTotal) => {
      console.log("[query-store] Decrementing queries by:", amount);
      set((state) => ({
        queriesRequested: Math.max(1, state.queriesRequested - amount),
        ...calculateQueriesState(
          Math.max(1, state.queriesRequested - amount),
          creditsTotal,
          state.queriesCostEach,
        ),
      }));
    },

    incrementQueries: (amount, creditsTotal) => {
      console.log("[query-store] Incrementing queries by:", amount);
      set((state) => ({
        queriesRequested: state.queriesRequested + amount,
        ...calculateQueriesState(
          state.queriesRequested + amount,
          creditsTotal,
          state.queriesCostEach,
        ),
      }));
    },

    setUserAiQueryAmountRequested: (amount, creditsTotal) => {
      console.log("[query-store] Setting user AI query amount requested:", amount);
      set(() => ({
        queriesRequested: amount,
        ...calculateQueriesState(amount, creditsTotal, DEFAULTS.QUERIES_COST_EACH),
      }));
    },

    setSelectedLLMIds: (llmIds) => {
      console.log("[query-store] Setting selectedLLMIds:", llmIds);
      set((state) => ({
        selectedLLMIds: llmIds,
        queriesRequested: llmIds.length,
        ...calculateQueriesState(llmIds.length, state.userCreditsTotal, DEFAULTS.QUERIES_COST_EACH),
      }));
    },

    resetAfterSubmission: (creditsTotal) => {
      console.log("[query-store] Resetting after submission");
      set(() => ({
        queriesRequested: DEFAULTS.QUERIES_REQUESTED,
        selectedLLMIds: [],
        ...calculateQueriesState(
          DEFAULTS.QUERIES_REQUESTED,
          creditsTotal,
          DEFAULTS.QUERIES_COST_EACH,
        ),
      }));
    },
  };
});