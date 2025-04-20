import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/db/client";
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
        console.log(`[useVoteHistory] Fetching vote history with limit: ${limit}`);
        const response = await fetch(`/api/vote-history?limit=${limit}`);
        console.log(`[useVoteHistory] Fetch status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
          throw new Error(`Vote history fetch failed: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`[useVoteHistory] Fetch response data:`, data);
        if (Array.isArray(data)) {
          console.log(`[useVoteHistory] Updating voteHistory with ${data.length} items`);
          setVoteHistory([...data]); // Force new array to trigger re-render
        } else {
          throw new Error("Invalid vote history data format");
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useVoteHistory] Failed to fetch vote history:", error);
        setError(error);
        setVoteHistory([]);
      }
    },
    [initialLimit],
  );

  useEffect(() => {
    console.log("[useVoteHistory] Effect running with initialLimit:", initialLimit);
    fetchVoteHistory();

    // Supabase subscription
    console.log("[useVoteHistory] Setting up Supabase subscription for VoteSession INSERT");
    const subscription = supabase
      .channel("vote-session-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "VoteSession" },
        (payload) => {
          console.log("[useVoteHistory] Received VoteSession INSERT payload:", payload);
          console.log("[useVoteHistory] Triggering fetchVoteHistory due to subscription");
          fetchVoteHistory();
        }
      )
      .subscribe((status, error) => {
        console.log(`[useVoteHistory] Subscription status: ${status}`, error ? `Error: ${error.message}` : "");
        if (status === "SUBSCRIBED") {
          console.log("[useVoteHistory] Subscription fully established");
        }
      });

    // Polling fallback
    const pollInterval = setInterval(() => {
      console.log("[useVoteHistory] Polling for vote history");
      fetchVoteHistory();
    }, 5000);

    return () => {
      console.log("[useVoteHistory] Cleaning up subscription and polling");
      supabase.removeChannel(subscription);
      clearInterval(pollInterval);
    };
  }, [fetchVoteHistory]);

  return { voteHistory, setVoteHistory, error, fetchVoteHistory };
}