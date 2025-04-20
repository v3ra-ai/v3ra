import { useState, useEffect } from "react";
import { useNetworkState } from "./useNetworkState";
import { supabase } from "@/lib/db/client";
import type { VoteResult } from "@/lib/types";

export function useVoteResult(voteSessionId?: string): { voteResult: VoteResult | null } {
  const { networkState } = useNetworkState();
  const lastQuery = networkState?.lastQuery;
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);

  // Fetch VoteResult
  const fetchVoteResult = async () => {
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
        // Handle /api/vote-sessions/[voteSessionId] (VoteSession without validatorResponses)
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
            validatorResponses: data.validatorResponses || [], // Fallback to empty array
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
    } catch (error) {
      console.error("[useVoteResult] Error fetching vote result:", error);
      // Fallback to mock data
      const simulatedVoteResult: VoteResult | null = lastQuery
        ? {
            id: `query-${Date.now()}`,
            isConsensusReached: true,
            consensusValue: true,
            queryText: lastQuery,
            validatorResponses: [
              {
                id: "validator-1",
                provider: "Provider A",
                profileName: "Alice",
                vote: "YES",
                rationale: "Supports the query.",
              },
              {
                id: "validator-2",
                provider: "Provider B",
                profileName: "Bob",
                vote: "YES",
                rationale: "Agrees with the proposal.",
              },
              {
                id: "validator-3",
                provider: "Provider C",
                profileName: "Charlie",
                vote: "NO",
                rationale: "Disagrees due to cost.",
              },
            ],
            votingResult: {
              yes: 2,
              no: 1,
              notVoted: 1,
            },
            timestamp: new Date().toISOString(),
          }
        : null;
      console.log(`[useVoteResult] Falling back to mock data:`, simulatedVoteResult);
      setVoteResult(simulatedVoteResult);
    }
  };

  useEffect(() => {
    console.log(`[useVoteResult] Effect running with voteSessionId: ${voteSessionId}, lastQuery: ${lastQuery}`);
    fetchVoteResult();

    // Supabase subscription (only for latest VoteResult)
    let subscription = null;
    if (!voteSessionId) {
      console.log("[useVoteResult] Setting up Supabase subscription for VoteSession INSERT");
      subscription = supabase
        .channel("vote-session-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "VoteSession" },
          (payload) => {
            console.log("[useVoteResult] Received VoteSession INSERT payload:", payload);
            const newVoteResult: VoteResult = {
              id: payload.new.id,
              queryText: payload.new.queryText,
              isConsensusReached: payload.new.isConsensusReached,
              consensusValue: payload.new.consensusValue,
              votingResult: {
                yes: payload.new.votesYes,
                no: payload.new.votesNo,
                notVoted: payload.new.notVoted,
              },
              validatorResponses: [],
              timestamp: payload.new.timestamp,
            };
            console.log("[useVoteResult] Setting new voteResult from subscription:", newVoteResult);
            setVoteResult(newVoteResult);
            fetchVoteResult();
          }
        )
        .subscribe((status, error) => {
          console.log(`[useVoteResult] Subscription status: ${status}`, error ? `Error: ${error.message}` : "");
        });
    }

    // Polling fallback
    const pollInterval = setInterval(() => {
      if (!voteSessionId) {
        console.log("[useVoteResult] Polling for latest VoteResult");
        fetchVoteResult();
      }
    }, 5000);

    return () => {
      console.log("[useVoteResult] Cleaning up subscription and polling");
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      clearInterval(pollInterval);
    };
  }, [lastQuery, voteSessionId]);

  return { voteResult };
}