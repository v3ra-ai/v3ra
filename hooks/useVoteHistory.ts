import { useState, useEffect, useCallback } from "react";
import type { VoteResult } from "@/lib/types";
import { sanitizeError } from "@/utils/security-utils";
import { RESULT_QUERIES_CARDS } from "@/lib/constants";

interface VoteHistoryResult {
  voteHistory: VoteResult[];
  setVoteHistory: React.Dispatch<React.SetStateAction<VoteResult[]>>;
  isLoading: boolean;
  error: Error | null;
  refetch: (limit?: number) => Promise<void>;
}

/**
 * Fetches the user's vote history from the /api/vote-history endpoint.
 * @param initialLimit Number of vote sessions to fetch (default: 10).
 * @returns An object containing the vote history, loading state, error, and refetch function.
 */
export function useVoteHistory(initialLimit: number = RESULT_QUERIES_CARDS): VoteHistoryResult {
  const [voteHistory, setVoteHistory] = useState<VoteResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const VOTE_HISTORY_API = "/api/vote-history";

  const refetch = useCallback(
    async (limit: number = initialLimit) => {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`[useVoteHistory] Refetching vote history with limit: ${limit}`);
        // Fetch and update vote history
        const response = await fetch(`${VOTE_HISTORY_API}?limit=${limit}`);
        console.log(`[useVoteHistory] Refetch status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
          throw new Error(`Vote history refetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`[useVoteHistory] Refetch response data:`, data);
        if (Array.isArray(data)) {
          console.log(`[useVoteHistory] Updating voteHistory with ${data.length} items`);
          setVoteHistory([...data]); // Force new array to trigger re-render
        } else {
          throw new Error("Invalid vote history data format");
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(sanitizeError(error));
        setError(error);
        setVoteHistory([]);
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit],
  );

  useEffect(() => {
    console.log("[useVoteHistory] Effect running with initialLimit:", initialLimit);
    refetch();
  }, [refetch]);

  return { voteHistory, setVoteHistory, isLoading, error, refetch };
}