"use client";

import { useCallback } from "react";
import { useVoteStore } from "@/store/vote-store";
import { VoteResult, QueryMode } from "@/lib/types";
import { submitQueryService } from "@/lib/services/query-service";
import { sanitizeQueryText } from "@/utils/security-utils";

// Log to confirm file is loaded
console.log("[useSubmitQuery] File loaded");

interface SubmitQueryOptions {
  queryMode?: QueryMode; // Allow QueryMode for type safety
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
      }); // Log incoming query and queryMode

      // Submit query and update vote history
      const sanitizedQuery = sanitizeQueryText(queryText);
      console.log(
        "[useSubmitQuery] Submitting query with queryMode:",
        options.queryMode
      );
      const queryResponse = await submitQueryService(
        sanitizedQuery,
        options.queryMode
      );
      console.log(
        "[useSubmitQuery] Submission successful, response:",
        queryResponse
      );
      setVoteHistory((prev: VoteResult[]) => [
        ...prev,
        queryResponse.voteResult,
      ]);
      setLastVoteResult(queryResponse.voteResult);
    },
    [setVoteHistory, setLastVoteResult]
  );

  return { submitQuery };
}
