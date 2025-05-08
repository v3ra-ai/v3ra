import { create } from "zustand";
import { DEFAULTS, QueryMode, ViewMode } from "@/lib/types";

// Log to confirm store initialization
console.log("[query-store] Initializing store");

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
  setUserAiQueryAmountRequested: (amount: number, queriesTotal: number) => void;
  resetAfterSubmission: (creditsTotal: number) => void;
}

// Helper function to calculate derived query states
const calculateQueriesState = (
  queriesRequested: number,
  creditsTotal: number,
  costEach: number
) => {
  const queriesUnpaid = Math.max(0, queriesRequested - creditsTotal); // Clamp to non-negative
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
      DEFAULTS.QUERIES_REQUESTED -
        (DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS)
    ),
    queriesCostEach: DEFAULTS.QUERIES_COST_EACH,
    queriesCostTotal:
      Math.max(
        0,
        DEFAULTS.QUERIES_REQUESTED -
          (DEFAULTS.USER_FREE_CREDITS + DEFAULTS.USER_PAID_CREDITS)
      ) * DEFAULTS.QUERIES_COST_EACH,
    userCreditConversion: DEFAULTS.USER_CREDIT_CONVERSION,
    queryMode: "factCheck" as QueryMode,
    viewMode: "viewExpert" as ViewMode,
  };
  console.log("[query-store] Initial state:", initialState); // Log initial state
  return {
    ...initialState,

    setQueriesRequested: (amount: number, creditsTotal: number) => {
      console.log("[query-store] Setting queriesRequested:", amount);
      set(() => ({
        queriesRequested: amount,
        ...calculateQueriesState(
          amount,
          creditsTotal,
          DEFAULTS.QUERIES_COST_EACH
        ),
      }));
    },

    setQueryMode: (mode: QueryMode) => {
      console.log("[query-store] Setting queryMode:", mode);
      set(() => ({ queryMode: mode }));
    },

    setViewMode: (mode: ViewMode) => {
      console.log("[query-store] Setting viewMode:", mode);
      set(() => ({ viewMode: mode }));
    },

    decrementQueries: (amount: number, creditsTotal: number) => {
      console.log("[query-store] Decrementing queries by:", amount);
      set((state) => ({
        ...calculateQueriesState(
          state.queriesRequested,
          creditsTotal,
          state.queriesCostEach
        ),
      }));
    },

    incrementQueries: (amount: number, creditsTotal: number) => {
      console.log("[query-store] Incrementing queries by:", amount);
      set((state) => ({
        ...calculateQueriesState(
          state.queriesRequested,
          creditsTotal,
          state.queriesCostEach
        ),
      }));
    },

    setUserAiQueryAmountRequested: (amount: number, creditsTotal: number) => {
      console.log(
        "[query-store] Setting user AI query amount requested:",
        amount
      );
      set(() => ({
        queriesRequested: amount,
        ...calculateQueriesState(
          amount,
          creditsTotal,
          DEFAULTS.QUERIES_COST_EACH
        ),
      }));
    },

    resetAfterSubmission: (creditsTotal: number) => {
      console.log("[query-store] Resetting after submission");
      set(() => ({
        queriesRequested: DEFAULTS.QUERIES_REQUESTED,
        ...calculateQueriesState(
          DEFAULTS.QUERIES_REQUESTED,
          creditsTotal,
          DEFAULTS.QUERIES_COST_EACH
        ),
      }));
    },
  };
});
