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

  const fetchNetworkState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/network");
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworkState();
  }, [fetchNetworkState]);

  return { networkState, isLoading, error, refetch: fetchNetworkState };
}