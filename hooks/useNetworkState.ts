import { useState, useEffect, useCallback } from "react";
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
        // Add cache-busting timestamp for refetch
        const url = isInitialLoad
          ? "/api/network"
          : `/api/network?t=${Date.now()}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Network fetch failed: ${response.statusText}`);
        }
        const data: NetworkState = await response.json();
        setNetworkState(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to fetch network state:", error);
        setError(error);
        setNetworkState(null);
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchNetworkState(true);
  }, [fetchNetworkState]);

  const refetch = useCallback(
    () => fetchNetworkState(false),
    [fetchNetworkState],
  );

  return { networkState, isLoading, error, refetch };
}
