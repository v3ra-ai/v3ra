import { NetworkState } from "@/lib/types";

/**
 * Provides fallback defaults for NetworkState fields when networkState is null.
 * @param networkState - The NetworkState object or null.
 * @returns An object with default values for validators, currentLeaderIndex, isVoting, and currentQuery.
 */
export function getNetworkStateDefaults(networkState: NetworkState | null): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validators: any[];
  currentLeaderIndex: number;
  isVoting: boolean;
  currentQuery: string | null;
} {
  return {
    validators: networkState?.validators || [],
    currentLeaderIndex: networkState?.currentLeaderIndex ?? 0,
    isVoting: networkState?.isVoting || false,
    currentQuery: networkState?.lastQuery || null,
  };
}
