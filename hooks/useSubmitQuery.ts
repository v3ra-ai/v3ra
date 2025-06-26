
"use client";

import { useCallback } from "react";
import { useVoteStore } from "@/store/vote-store";
import { VoteResult, QueryMode } from "@/lib/types";
import { submitQueryService } from "@/lib/services/query-service";
import { sanitizeQueryText } from "@/utils/security-utils";
import { RESULT_QUERIES_CARDS } from "@/lib/constants";

// Log to confirm file is loaded
console.log("[useSubmitQuery] File loaded");

interface SubmitQueryOptions {
  queryMode?: QueryMode; // Allow QueryMode for type safety
  queriesRequested?: number; // Number of validators to query
}

interface SubmitQueryReturn {
  submitQuery: (
    queryText: string,
    options?: SubmitQueryOptions
  ) => Promise<void>;
}

export function useSubmitQuery(): SubmitQueryReturn {
  const { setVoteHistory, setLastVoteResult } = useVoteStore();

  const submitQuery = useCallback(
    async (queryText: string, options: SubmitQueryOptions = {}) => {
      console.log("[useSubmitQuery] Received query with options:", {
        queryText,
        queryMode: options.queryMode,
        queriesRequested: options.queriesRequested,
      });

      // Submit query and update vote history
      const sanitizedQuery = sanitizeQueryText(queryText);
      console.log("[useSubmitQuery] Submitting query with queryMode:", options.queryMode, "queriesRequested:", options.queriesRequested);
      const queryResponse = await submitQueryService(
        sanitizedQuery,
        options.queryMode || "fact-check",
        options.queriesRequested
      );
      console.log("[useSubmitQuery] Submission successful, response:", queryResponse);
      
      // Check if the response is an error
      if ("error" in queryResponse) {
        console.error("[useSubmitQuery] Query failed:", queryResponse.error);
        throw new Error(queryResponse.error);
      }
      
      setVoteHistory((prev: VoteResult[]) => {
        const newHistory = [...prev, queryResponse].slice(0, RESULT_QUERIES_CARDS);
        console.log("[useSubmitQuery] Updating voteHistory:", newHistory.length, "items");
        return newHistory;
      });
      setLastVoteResult(queryResponse);
    },
    [setVoteHistory, setLastVoteResult]
  );

  return { submitQuery };
}