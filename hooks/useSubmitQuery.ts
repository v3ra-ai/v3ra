import { useCallback } from "react";
import { useQueryStore, VoteResult } from "@/store/query-store";
import { submitQueryService } from "@/lib/services/query-service";

interface SubmitQueryReturn {
  submitQuery: (queryText: string) => Promise<void>;
}

export function useSubmitQuery(): SubmitQueryReturn {
  const { setVoteHistory, setLastVoteResult } = useQueryStore();

  const submitQuery = useCallback(
    async (queryText: string) => {
      const response = await submitQueryService(queryText);
      setVoteHistory((prev: VoteResult[]) => [...prev, response.voteResult]);
      setLastVoteResult(response.voteResult);
    },
    [setVoteHistory, setLastVoteResult]
  );

  return { submitQuery };
}