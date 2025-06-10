import { create } from "zustand";
import { DEFAULTS, QueryMode, ViewMode } from "@/lib/types";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";

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
  setUserCreditsTotal: (creditsTotal: number) => void;
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

    setQueriesRequested: (amount, creditsTotal) =>
      set((state) => {
        const maxQueries = state.selectedLLMIds.length > 0 ? state.selectedLLMIds.length : ALLOWED_AMOUNT_QUERIES;
        const clampedAmount = Math.max(1, Math.min(maxQueries, amount));
        console.log("[query-store] Setting queriesRequested:", clampedAmount, { maxQueries });
        return {
          queriesRequested: clampedAmount,
          ...calculateQueriesState(clampedAmount, creditsTotal, state.queriesCostEach),
        };
      }),

    setQueryMode: (mode) => {
      console.log("[query-store] Setting queryMode:", mode);
      set(() => ({ queryMode: mode }));
    },

    setViewMode: (mode) => {
      console.log("[query-store] Setting viewMode:", mode);
      set(() => ({ viewMode: mode }));
    },

    decrementQueries: (amount, creditsTotal) =>
      set((state) => {
        const maxQueries = state.selectedLLMIds.length > 0 ? state.selectedLLMIds.length : ALLOWED_AMOUNT_QUERIES;
        const newAmount = Math.max(1, Math.min(maxQueries, state.queriesRequested - amount));
        console.log("[query-store] Decrementing queries:", newAmount);
        return {
          queriesRequested: newAmount,
          ...calculateQueriesState(newAmount, creditsTotal, state.queriesCostEach),
        };
      }),

    incrementQueries: (amount, creditsTotal) =>
      set((state) => {
        const maxQueries = state.selectedLLMIds.length > 0 ? state.selectedLLMIds.length : ALLOWED_AMOUNT_QUERIES;
        const newAmount = Math.min(maxQueries, state.queriesRequested + amount);
        console.log("[query-store] Incrementing queries:", newAmount);
        return {
          queriesRequested: newAmount,
          ...calculateQueriesState(newAmount, creditsTotal, state.queriesCostEach),
        };
      }),

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
        queriesRequested: llmIds.length > 0 ? Math.min(llmIds.length, state.queriesRequested) : state.queriesRequested,
        ...calculateQueriesState(
          llmIds.length > 0 ? Math.min(llmIds.length, state.queriesRequested) : state.queriesRequested,
          state.userCreditsTotal,
          state.queriesCostEach,
        ),
      }));
    },

    resetAfterSubmission: (creditsTotal) => {
      console.log("[query-store] Resetting after submission");
      set((state) => ({
        queriesRequested: state.selectedLLMIds.length > 0 ? state.selectedLLMIds.length : DEFAULTS.QUERIES_REQUESTED,
        selectedLLMIds: [],
        ...calculateQueriesState(
          state.selectedLLMIds.length > 0 ? state.selectedLLMIds.length : DEFAULTS.QUERIES_REQUESTED,
          creditsTotal,
          DEFAULTS.QUERIES_COST_EACH,
        ),
      }));
    },

    setUserCreditsTotal: (creditsTotal) => {
      console.log("[query-store] Setting userCreditsTotal:", creditsTotal);
      set((state) => ({
        userCreditsTotal: creditsTotal,
        ...calculateQueriesState(state.queriesRequested, creditsTotal, state.queriesCostEach),
      }));
    },
  };
});