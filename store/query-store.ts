import { create } from "zustand";
import { createLogger } from "@/lib/logger";

const logger = createLogger('query-store');
import { QueryMode } from "@/lib/types";

logger.info('Initializing store for blind testing');

interface QueryStore {
  queriesRequested: number; // Always 2 for blind testing
  queryMode: QueryMode;
  setQueryMode: (mode: QueryMode) => void;
  resetAfterSubmission: (creditsTotal: number) => void;
}

export const useQueryStore = create<QueryStore>((set) => {
  const initialState = {
    queriesRequested: 2, // Always 2 models for blind testing
    queryMode: "fact-check" as QueryMode,
  };
  
  return {
    ...initialState,

    setQueryMode: (mode) => {
      set(() => ({ queryMode: mode }));
    },

    resetAfterSubmission: (_creditsTotal) => {
      // For blind testing, we don't need to reset much
      // Just maintain the state
      set(() => ({
        queriesRequested: 2, // Always 2 for blind testing
      }));
    },
  };
});