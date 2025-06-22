import { useState, useEffect, useCallback } from "react";
import type { VoteResult } from "@/lib/types";
import { useVoteStore } from "@/store/vote-store";
import { sanitizeError } from "@/utils/security-utils";
import { INITIAL_LOAD_COUNT, LOAD_MORE_COUNT, MAX_VOTE_HISTORY_RESULTS } from "@/lib/constants";

// Log to confirm file is loaded
console.log("[useVoteHistory] File loaded");

interface VoteHistoryResult {
  voteHistory: VoteResult[];
  setVoteHistory: React.Dispatch<React.SetStateAction<VoteResult[]>>;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  refetch: (limit?: number) => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * Fetches the user's vote history from the /api/vote-history endpoint with infinite scroll support.
 * @param initialLimit Number of vote sessions to fetch initially (default: INITIAL_LOAD_COUNT).
 * @returns An object containing the vote history, loading states, error, and control functions.
 */
export function useVoteHistory(initialLimit: number = INITIAL_LOAD_COUNT): VoteHistoryResult {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const {
    voteHistory,
    setVoteHistory,
    appendVoteHistory,
    voteSessionCount,
    setVoteSessionCount,
    isLoadingMore,
    setIsLoadingMore,
    hasMore,
    setHasMore,
    offset,
    setOffset,
    resetPagination,
  } = useVoteStore();
  const VOTE_HISTORY_API = "/api/vote-history";

  const validateAndFormatHistory = (data: any[]): VoteResult[] => {
    return data
      .filter((item): item is VoteResult =>
        item &&
        typeof item.id === 'string' &&
        typeof item.queryText === 'string' &&
        item.queryText.trim() !== '' &&
        Array.isArray(item.validatorResponses) &&
        typeof item.votingResult === 'object' &&
        typeof item.votingResult.yes === 'number' &&
        typeof item.votingResult.no === 'number' &&
        typeof item.votingResult.notVoted === 'number'
      )
      .map((item) => ({
        id: item.id,
        queryText: item.queryText,
        isConsensusReached: item.isConsensusReached ?? false,
        consensusValue: item.consensusValue ?? null,
        validatorResponses: item.validatorResponses.map((res: any) => ({
          id: res.id,
          provider: res.provider || 'Unknown',
          profileName: res.profileName || 'Unknown',
          vote: res.vote || 'UNKNOWN',
          rationale: res.rationale || '',
        })),
        votingResult: {
          yes: item.votingResult.yes,
          no: item.votingResult.no,
          notVoted: item.votingResult.notVoted,
        },
        timestamp: item.timestamp ?? undefined,
      }));
  };

  const refetch = useCallback(
    async (limit: number = initialLimit) => {
      try {
        setIsLoading(true);
        setError(null);
        resetPagination();
        console.log("[useVoteHistory] Refetching with limit:", limit);

        // Fetch vote session count
        const countResponse = await fetch(`${VOTE_HISTORY_API}?countOnly=true`);
        if (!countResponse.ok) {
          throw new Error(`Vote session count fetch failed: ${countResponse.statusText}`);
        }
        const countData = await countResponse.json();
        setVoteSessionCount(countData.count);

        // Fetch initial vote history
        const response = await fetch(`${VOTE_HISTORY_API}?limit=${limit}&offset=0`);
        if (!response.ok) {
          throw new Error(`Vote history fetch failed: ${response.statusText}`);
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid vote history data format");
        }

        const validatedHistory = validateAndFormatHistory(data);
        console.log("[useVoteHistory] Initial load:", validatedHistory.length, "items");
        
        setVoteHistory(validatedHistory);
        setOffset(validatedHistory.length);
        setHasMore(validatedHistory.length < countData.count && validatedHistory.length < MAX_VOTE_HISTORY_RESULTS);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useVoteHistory] Error:", sanitizeError(error));
        setError(error);
        setVoteHistory([]);
      } finally {
        setIsLoading(false);
      }
    },
    [initialLimit, setVoteHistory, setVoteSessionCount, setOffset, setHasMore, resetPagination],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      console.log("[useVoteHistory] Skipping loadMore:", { isLoadingMore, hasMore });
      return;
    }

    try {
      setIsLoadingMore(true);
      setError(null);
      console.log("[useVoteHistory] Loading more from offset:", offset);

      const response = await fetch(`${VOTE_HISTORY_API}?limit=${LOAD_MORE_COUNT}&offset=${offset}`);
      if (!response.ok) {
        throw new Error(`Vote history loadMore failed: ${response.statusText}`);
      }
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid vote history data format");
      }

      const validatedHistory = validateAndFormatHistory(data);
      console.log("[useVoteHistory] Loaded", validatedHistory.length, "more items");

      if (validatedHistory.length === 0) {
        setHasMore(false);
      } else {
        appendVoteHistory(validatedHistory);
        // Check if we've reached the limit
        const newTotal = voteHistory.length + validatedHistory.length;
        setHasMore(
          validatedHistory.length === LOAD_MORE_COUNT && 
          newTotal < voteSessionCount && 
          newTotal < MAX_VOTE_HISTORY_RESULTS
        );
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[useVoteHistory] LoadMore error:", sanitizeError(error));
      setError(error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, offset, voteHistory.length, voteSessionCount, appendVoteHistory, setIsLoadingMore, setHasMore]);

  useEffect(() => {
    // Initial fetch on mount
    console.log("[useVoteHistory] Initial mount effect");
    refetch();
  }, []); // Empty dependency array for mount-only effect

  return { 
    voteHistory, 
    setVoteHistory, 
    isLoading, 
    isLoadingMore,
    error, 
    hasMore,
    refetch,
    loadMore,
  };
}