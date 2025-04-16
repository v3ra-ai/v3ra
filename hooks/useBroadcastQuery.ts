import { useCallback } from "react";
import { broadcastCustomQuery } from "@/app/actions";
import type { VoteResult } from "@/lib/types";

interface BroadcastQueryResult {
  broadcastQuery: (query: string) => Promise<void>;
}

export function useBroadcastQuery(
  setVoteHistory: React.Dispatch<React.SetStateAction<VoteResult[]>>,
  setLastVoteResult: React.Dispatch<React.SetStateAction<VoteResult | null>>,
  refetchNetworkState?: () => Promise<void>,
  fetchVoteHistory?: () => Promise<void>,
): BroadcastQueryResult {
  const broadcastQuery = useCallback(
    async (query: string) => {
      try {
        const result = await broadcastCustomQuery(query);
        if ("error" in result) {
          throw new Error(result.error);
        }

        setLastVoteResult(result as VoteResult);
        setVoteHistory((prevHistory: VoteResult[]) =>
          [result as VoteResult, ...prevHistory].slice(0, 10),
        );

        // Shorter delay for faster update
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Refetch with one retry
        const retries = 1;
        let lastError: Error | null = null;
        for (let i = 0; i <= retries; i++) {
          try {
            await Promise.all([
              fetchVoteHistory ? fetchVoteHistory() : Promise.resolve(),
              refetchNetworkState ? refetchNetworkState() : Promise.resolve(),
            ]);
            console.log(`Refetch successful after ${i} retries`);
            return;
          } catch (err: unknown) {
            lastError = err instanceof Error ? err : new Error(String(err));
            console.warn(`Refetch attempt ${i + 1} failed:`, lastError);
            if (i < retries) {
              // 500ms backoff
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }
        if (lastError) {
          console.error("Failed to refetch data after retry:", lastError);
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to broadcast custom query:", error);
        throw error; // Let CustomQueryForm handle the error
      }
    },
    [setVoteHistory, setLastVoteResult, refetchNetworkState, fetchVoteHistory],
  );

  return { broadcastQuery };
}