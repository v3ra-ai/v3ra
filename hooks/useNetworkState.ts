
import { useState, useEffect, useCallback } from "react";
import { useQueryStore } from "@/store/query-store";
import type { NetworkState, Validator } from "@/lib/types";

interface NetworkStateResult {
  networkState: NetworkState | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Type guard to validate Validator array
function isValidatorArray(data: unknown): data is Validator[] {
  if (!Array.isArray(data)) {
    console.warn("[useNetworkState] Validator data is not an array:", data);
    return false;
  }
  return data.every(item =>
    item != null &&
    typeof item === "object" &&
    typeof item.id === "string" &&
    typeof item.publicKey === "string" &&
    typeof item.provider === "string" &&
    typeof item.profileName === "string"
  );
}

export function useNetworkState(): NetworkStateResult {
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { lastVoteResult, validators, lastFetchedValidators, setValidators } = useQueryStore();
  const NETWORK_API_URL = "/api/network";
  const VALIDATORS_API_URL = "/api/validators";
  const CACHE_DURATION = 180000; // 3 minutes in milliseconds

  const fetchNetworkState = useCallback(
    async (isInitialLoad: boolean = false) => {
      try {
        if (isInitialLoad) {
          setIsLoading(true);
        }
        setError(null);

        // Check for cached validators
        let validatorData: Validator[] = [];
        if (validators && lastFetchedValidators && Date.now() - lastFetchedValidators < CACHE_DURATION) {
          console.log("[useNetworkState] Using cached validators");
          validatorData = validators;
        } else {
          console.log("[useNetworkState] Fetching validators from", VALIDATORS_API_URL);
          const validatorResponse = await fetch(VALIDATORS_API_URL);
          if (!validatorResponse.ok) {
            throw new Error(`Validators fetch failed: ${validatorResponse.statusText}`);
          }
          const rawData = await validatorResponse.json();
          console.log("[useNetworkState] Raw validator data:", rawData);
          if (!isValidatorArray(rawData)) {
            console.warn("[useNetworkState] Invalid validators data received, using empty array");
            validatorData = [];
          } else {
            validatorData = rawData;
          }
          setValidators(validatorData, Date.now());
          console.log("[useNetworkState] Validators fetched and cached:", validatorData);
        }

        // Fetch network state
        const url = isInitialLoad ? NETWORK_API_URL : `${NETWORK_API_URL}?t=${Date.now()}`;
        console.log("[useNetworkState] Fetching network state from", url);
        const response = await fetch(url);
        console.log("[useNetworkState] Fetch status:", response.status, response.statusText);
        if (!response.ok) {
          throw new Error(`Network state fetch failed: ${response.statusText}`);
        }
        const data: NetworkState = await response.json();
        console.log("[useNetworkState] Fetch response data:", data);

        // Combine network state with validators
        setNetworkState({ ...data, validators: validatorData });
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
    [validators, lastFetchedValidators, setValidators],
  );

  const refetch = useCallback(async () => {
    console.log("[useNetworkState] Manual refetch triggered");
    await fetchNetworkState(false);
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