
import { useState, useEffect, useCallback } from "react";
import type { VoteResult } from "@/lib/types";
import { useVoteStore } from "@/store/vote-store";
import { sanitizeError } from "@/utils/security-utils";
import { RESULT_QUERIES_CARDS } from "@/lib/constants";

// Log to confirm file is loaded
console.log("[useVoteHistory] File loaded");

interface VoteHistoryResult {
  voteHistory: VoteResult[];
  setVoteHistory: React.Dispatch<React.SetStateAction<VoteResult[]>>;
  isLoading: boolean;
  error: Error | null;
  refetch: (limit?: number) => Promise<void>;
}

/**
 * Fetches the user's vote history from the /api/vote-history endpoint, only refetching if the vote session count has changed.
 * @param initialLimit Number of vote sessions to fetch (default: RESULT_QUERIES_CARDS = 12).
 * @returns An object containing the vote history, loading state, error, and refetch function.
 */
export function useVoteHistory(initialLimit: number = RESULT_QUERIES_CARDS): VoteHistoryResult {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { voteHistory, setVoteHistory, voteSessionCount, setVoteSessionCount } = useVoteStore();
  const VOTE_HISTORY_API = "/api/vote-history";

  const refetch = useCallback(
    async (limit: number = initialLimit) => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("[useVoteHistory] Checking vote session count, current:", voteSessionCount, "limit:", limit);

        // Fetch vote session count
        const countResponse = await fetch(`${VOTE_HISTORY_API}?countOnly=true`);
        console.log("[useVoteHistory] Count fetch status:", countResponse.status);
        if (!countResponse.ok) {
          throw new Error(`Vote session count fetch failed: ${countResponse.statusText}`);
        }
        const countData = await countResponse.json();
        console.log("[useVoteHistory] Count response:", countData);

        if (typeof countData.count !== "number") {
          throw new Error("Invalid vote session count format");
        }

        // Update store with new count
        setVoteSessionCount(countData.count);

        // Skip full refetch if count hasn't changed
        if (countData.count === voteSessionCount && voteHistory.length > 0) {
          console.log("[useVoteHistory] Vote session count unchanged, reusing stored voteHistory:", voteHistory.length, "items");
          return;
        }

        // Fetch full vote history
        console.log("[useVoteHistory] Refetching vote history with limit:", limit);
        const response = await fetch(`${VOTE_HISTORY_API}?limit=${limit}`);
        console.log("[useVoteHistory] Refetch status:", response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`Vote history refetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        console.log("[useVoteHistory] Refetch response data:", data);

        if (Array.isArray(data)) {
          console.log("[useVoteHistory] Updating voteHistory with", data.length, "items");
          setVoteHistory([...data]); // Force new array to trigger re-render
        } else {
          throw new Error("Invalid vote history data format");
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useVoteHistory] Error:", sanitizeError(error));
        setError(error);
        setVoteHistory([]);
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit, voteSessionCount, voteHistory.length, setVoteHistory, setVoteSessionCount],
  );

  useEffect(() => {
    console.log("[useVoteHistory] Effect running with initialLimit:", initialLimit);
    refetch();
  }, [refetch]);

  return { voteHistory, setVoteHistory, isLoading, error, refetch };
}