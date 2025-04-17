import { useState, useEffect, useCallback } from "react";
import type { VoteResult } from "@/lib/types";

interface VoteHistoryResult {
  voteHistory: VoteResult[];
  setVoteHistory: React.Dispatch<React.SetStateAction<VoteResult[]>>;
  error: Error | null;
  fetchVoteHistory: (limit?: number) => Promise<void>;
}

export function useVoteHistory(initialLimit: number = 10): VoteHistoryResult {
  const [voteHistory, setVoteHistory] = useState<VoteResult[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchVoteHistory = useCallback(
    async (limit: number = initialLimit) => {
      try {
        setError(null);
        const response = await fetch(`/api/vote-history?limit=${limit}`);
        if (!response.ok) {
          throw new Error(`Vote history fetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setVoteHistory(data);
        } else {
          throw new Error("Invalid vote history data format");
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to fetch vote history:", error);
        setError(error);
        setVoteHistory([]);
      }
    },
    [initialLimit],
  );

  useEffect(() => {
    fetchVoteHistory();
  }, [fetchVoteHistory]);

  return { voteHistory, setVoteHistory, error, fetchVoteHistory };
}
