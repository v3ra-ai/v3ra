import { useState, useEffect, useCallback } from "react";
import { useNetworkState } from "./useNetworkState";
import { useQueryStore } from "@/store/query-store";
import type { VoteResult } from "@/lib/types";

interface VoteResultHookResult {
  voteResult: VoteResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVoteResult(voteSessionId?: string): VoteResultHookResult {
  const { networkState } = useNetworkState();
  const lastQuery = networkState?.lastQuery;
  const { lastVoteResult } = useQueryStore();
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVoteResult = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = voteSessionId
        ? `/api/vote-sessions/${voteSessionId}`
        : "/api/vote-history?limit=1";
      console.log(`[useVoteResult] Fetching VoteResult from ${url}`);

      const response = await fetch(url);
      console.log(`[useVoteResult] Fetch status: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[useVoteResult] Fetch response:`, data);

      let fetchedVoteResult: VoteResult | null = null;
      if (voteSessionId) {
        // Handle /api/vote-sessions/[voteSessionId]
        if (data && data.id) {
          fetchedVoteResult = {
            id: data.id,
            queryText: data.queryText,
            isConsensusReached: data.isConsensusReached,
            consensusValue: data.consensusValue,
            votingResult: {
              yes: data.votesYes,
              no: data.votesNo,
              notVoted: data.notVoted,
            },
            validatorResponses: data.validatorResponses || [],
            timestamp: data.timestamp,
          };
        }
      } else {
        // Handle /api/vote-history (array of VoteResult)
        fetchedVoteResult = Array.isArray(data) && data[0] ? data[0] : null;
      }

      if (fetchedVoteResult) {
        console.log(`[useVoteResult] Setting voteResult:`, fetchedVoteResult);
        setVoteResult(fetchedVoteResult);
      } else {
        throw new Error("No vote result found");
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("[useVoteResult] Error fetching vote result:", error);
      setError(error);
      setVoteResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [voteSessionId]);

  // Initial fetch when voteSessionId or lastQuery changes
  useEffect(() => {
    console.log(`[useVoteResult] Effect running for initial fetch, voteSessionId: ${voteSessionId}, lastQuery: ${lastQuery}`);
    fetchVoteResult();
  }, [voteSessionId, lastQuery, fetchVoteResult]);

  // Fetch on query submission if voteSessionId matches lastVoteResult.id
  useEffect(() => {
    if (lastVoteResult && (!voteSessionId || lastVoteResult.id === voteSessionId)) {
      console.log("[useVoteResult] New vote result detected, triggering fetchVoteResult");
      fetchVoteResult();
    }
  }, [lastVoteResult, voteSessionId, fetchVoteResult]);

  const refetch = useCallback(async () => {
    console.log("[useVoteResult] Manual refetch triggered");
    await fetchVoteResult();
  }, [fetchVoteResult]);

  return { voteResult, isLoading, error, refetch };
}