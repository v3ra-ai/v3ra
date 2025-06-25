import { create } from "zustand";
import { DEFAULTS, QueryMode, ViewMode } from "@/lib/types";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";
import { useLLMStore } from "./llm-store";

console.log("[query-store] Initializing store");

interface QueryStore {
  queriesRequested: number;
  queryMode: QueryMode;
  viewMode: ViewMode;
  selectedLLMIds: string[];
  setQueriesRequested: (amount: number, creditsTotal: number) => void;
  setQueryMode: (mode: QueryMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedLLMIds: (llmIds: string[]) => void;
  resetAfterSubmission: (creditsTotal: number) => void;
}


// Initialize selectedLLMIds and queriesRequested based on useLLMStore
const getInitialLLMState = () => {
  const llms = useLLMStore.getState().llms;
  const enabledLLMIds = llms.filter((llm) => llm.enabled).map((llm) => llm.id);
  const queriesRequested = enabledLLMIds.length > 0
    ? enabledLLMIds.length
    : DEFAULTS.QUERIES_REQUESTED;
  console.log("[query-store] Initial LLM state:", {
    enabledLLMIds,
    queriesRequested,
  });
  return { selectedLLMIds: enabledLLMIds, queriesRequested };
};

export const useQueryStore = create<QueryStore>((set) => {
  const { selectedLLMIds, queriesRequested } = getInitialLLMState();
  const initialState = {
    queriesRequested,
    queryMode: "fact-check" as QueryMode,
    viewMode: "viewExpert" as ViewMode,
    selectedLLMIds,
  };
  console.log("[query-store] Initial state:", initialState);
  return {
    ...initialState,

    setQueriesRequested: (amount, _creditsTotal) =>
      set(() => {
        const llms = useLLMStore.getState().llms;
        const enabledLLMIds = llms.filter((llm) => llm.enabled).map((llm) => llm.id);
        const maxQueries = enabledLLMIds.length > 0 ? enabledLLMIds.length : ALLOWED_AMOUNT_QUERIES;
        const clampedAmount = Math.max(1, Math.min(maxQueries, amount));
        console.log("[query-store] Setting queriesRequested:", clampedAmount, { maxQueries });
        return {
          queriesRequested: clampedAmount,
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


    setSelectedLLMIds: (llmIds) => {
      console.log("[query-store] Setting selectedLLMIds:", llmIds);
      set(() => ({
        selectedLLMIds: llmIds,
        queriesRequested: llmIds.length > 0 ? llmIds.length : DEFAULTS.QUERIES_REQUESTED,
      }));
    },

    resetAfterSubmission: (_creditsTotal) => {
      console.log("[query-store] Resetting after submission");
      set(() => {
        const llms = useLLMStore.getState().llms;
        const enabledLLMIds = llms.filter((llm) => llm.enabled).map((llm) => llm.id);
        const newQueriesRequested = enabledLLMIds.length > 0 ? enabledLLMIds.length : DEFAULTS.QUERIES_REQUESTED;
        console.log("[query-store] Reset after submission:", {
          enabledLLMIds,
          newQueriesRequested,
        });
        return {
          queriesRequested: newQueriesRequested,
          selectedLLMIds: enabledLLMIds,
        };
      });
    },
  };
});