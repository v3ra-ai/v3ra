import { useState, useEffect } from "react";
import { VoteResult } from "@/lib/types";
import { fetchVoteHistory } from "@/app/actions";

interface UseVoteHistoryResult {
  voteHistory: VoteResult[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVoteHistory(): UseVoteHistoryResult {
  const [voteHistory, setVoteHistory] = useState<VoteResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await fetchVoteHistory();
      
      if (Array.isArray(history)) {
        setVoteHistory(history);
      } else {
        throw new Error(history.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch vote history"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    voteHistory,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}