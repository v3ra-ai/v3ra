import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/db/client";
import type { NetworkState } from "@/lib/types";

interface NetworkStateResult {
  networkState: NetworkState | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useNetworkState(): NetworkStateResult {
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNetworkState = useCallback(
    async (isInitialLoad: boolean = false) => {
      try {
        if (isInitialLoad) {
          setIsLoading(true);
        }
        setError(null);
        const url = isInitialLoad ? "/api/network" : `/api/network?t=${Date.now()}`;
        console.log(`[useNetworkState] Fetching network state from ${url}`);
        const response = await fetch(url);
        console.log(`[useNetworkState] Fetch status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
          throw new Error(`Network state fetch failed: ${response.statusText}`);
        }
        const data: NetworkState = await response.json();
        console.log("[useNetworkState] Fetch response data:", data);
        setNetworkState({ ...data }); // Force new object
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useNetworkState] Failed to fetch network state:", error);
        setError(error);
        setNetworkState(null);
      } finally {
        if (isInitialLoad) {
          console.log("[useNetworkState] Initial load complete, isLoading set to false");
          setIsLoading(false);
        }
      }
    },
    [],
  );

  const refetch = useCallback(async () => {
    console.log("[useNetworkState] Manual refetch triggered");
    await fetchNetworkState(false);
  }, [fetchNetworkState]);

  useEffect(() => {
    console.log("[useNetworkState] Effect running");
    fetchNetworkState(true);

    // Supabase subscription
    console.log("[useNetworkState] Setting up Supabase subscription for VoteSession INSERT");
    const subscription = supabase
      .channel("vote-session-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "VoteSession" },
        (payload) => {
          console.log("[useNetworkState] Received VoteSession INSERT payload:", payload);
          console.log("[useNetworkState] Triggering fetchNetworkState");
          fetchNetworkState(false);
        }
      )
      .subscribe((status, error) => {
        console.log(`[useNetworkState] Subscription status: ${status}`, error ? `Error: ${error.message}` : "");
        if (status === "SUBSCRIBED") {
          console.log("[useNetworkState] Subscription fully established");
        }
      });

    // Polling fallback
    const pollInterval = setInterval(() => {
      console.log("[useNetworkState] Polling for network state");
      fetchNetworkState(false);
    }, 5000);

    return () => {
      console.log("[useNetworkState] Cleaning up subscription and polling");
      supabase.removeChannel(subscription);
      clearInterval(pollInterval);
    };
  }, [fetchNetworkState]);

  return { networkState, isLoading, error, refetch };
}