import { useState, useEffect, useCallback } from "react";
import { useVoteStore } from "@/store/vote-store";
import { useNetworkStore } from "@/store/network-store";
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
  const { lastVoteResult } = useVoteStore();
  const { networkStateCache, networkStateTimestamp, setNetworkStateCache } = useNetworkStore();
  const NETWORK_API_URL = "/api/network";

  const fetchNetworkState = useCallback(
    async (isInitialLoad: boolean = false, forceFetch: boolean = false) => {
      try {
        // Check global cache: skip fetch if data exists and less than 3 minutes old
        if (
          !forceFetch &&
          networkStateCache &&
          networkStateTimestamp &&
          Date.now() - networkStateTimestamp < 180000 // 3 minutes in ms
        ) {
          console.log("[useNetworkState] Using cached network state from global store");
          setNetworkState({ ...networkStateCache });
          if (isInitialLoad) {
            setIsLoading(false);
          }
          return;
        }

        if (isInitialLoad) {
          setIsLoading(true);
        }
        setError(null);
        const url = isInitialLoad ? NETWORK_API_URL : `${NETWORK_API_URL}?t=${Date.now()}`;
        console.log(`[useNetworkState] Fetching network state from ${url}`);
        // Fetch and update network state
        const response = await fetch(url);
        console.log(`[useNetworkState] Fetch status: ${response.status} ${response.statusText}`);
        if (!response.ok) {
          throw new Error(`Network state fetch failed: ${response.statusText}`);
        }
        const data: NetworkState = await response.json();
        console.log("[useNetworkState] Fetch response data:", data);
        setNetworkState({ ...data }); // Force new object
        // Update global cache
        setNetworkStateCache({ ...data }, Date.now());
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useNetworkState] Failed to fetch network state:", error);
        setError(error);
        setNetworkState(null);
        // Clear global cache on error
        setNetworkStateCache(null, null);
      } finally {
        if (isInitialLoad) {
          console.log("[useNetworkState] Initial load complete, isLoading set to false");
          setIsLoading(false);
        }
      }
    },
    [networkStateCache, networkStateTimestamp, setNetworkStateCache],
  );

  const refetch = useCallback(async () => {
    console.log("[useNetworkState] Manual refetch triggered");
    await fetchNetworkState(false, true); // Force fetch on manual refetch
  }, [fetchNetworkState]);

  // Initial fetch on mount
  useEffect(() => {
    console.log("[useNetworkState] Effect running for initial load");
    fetchNetworkState(true);
  }, [fetchNetworkState]);

  // Fetch on query submission
  useEffect(() => {
    if (lastVoteResult) {
      console.log("[useNetworkState] New vote result detected, triggering fetchNetworkState");
      fetchNetworkState(false);
    }
  }, [lastVoteResult, fetchNetworkState]);

  return { networkState, isLoading, error, refetch };
}