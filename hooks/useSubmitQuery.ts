import { useCallback } from "react";
import { useVoteStore } from "@/store/vote-store";
import { VoteResult } from "@/lib/types";
import { submitQueryService } from "@/lib/services/query-service";
import { sanitizeQueryText } from "@/utils/security-utils";

interface SubmitQueryReturn {
  submitQuery: (queryText: string) => Promise<void>;
}

export function useSubmitQuery(): SubmitQueryReturn {
  const { setVoteHistory, setLastVoteResult } = useVoteStore();

  const submitQuery = useCallback(
    async (queryText: string) => {
      // Submit query and update vote history
      const sanitizedQuery = sanitizeQueryText(queryText);
      const queryResponse = await submitQueryService(sanitizedQuery);
      setVoteHistory((prev: VoteResult[]) => [...prev, queryResponse.voteResult]);
      setLastVoteResult(queryResponse.voteResult);
    },
    [setVoteHistory, setLastVoteResult],
  );

  return { submitQuery };
}