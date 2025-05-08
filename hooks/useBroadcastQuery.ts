"use client";

import { useCallback } from "react";
import type { VoteResult } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";
import { sanitizeError } from "@/utils/security-utils";
import { RESULT_QUERIES_CARDS } from "@/lib/constants";

// Log to confirm file is loaded
console.log("[useBroadcastQuery] File loaded");

interface BroadcastQueryOptions {
  csrfToken?: string;
  queryMode?: string; // Allow string to match QueryMode
  queriesRequested?: number; // Number of validators to query
}

interface BroadcastQueryResult {
  broadcastQuery: (
    query: string,
    options?: BroadcastQueryOptions
  ) => Promise<void>;
}

const refetchWithRetry = async (
  retries: number,
  fetchVoteHistory?: () => Promise<void>,
  refetchNetworkState?: () => Promise<void>
) => {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      await Promise.all([
        fetchVoteHistory ? fetchVoteHistory() : Promise.resolve(),
        refetchNetworkState ? refetchNetworkState() : Promise.resolve(),
      ]);
      console.log(`[useBroadcastQuery] Refetch successful after ${i} retries`);
      return;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[useBroadcastQuery] Refetch attempt ${i + 1} failed:`,
        lastError
      );
      if (i < retries) await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  if (lastError) console.error(sanitizeError(lastError));
};

export function useBroadcastQuery(
  setVoteHistory: Dispatch<SetStateAction<VoteResult[]>>,
  setLastVoteResult: Dispatch<SetStateAction<VoteResult | null>>,
  refetchNetworkState?: () => Promise<void>,
  fetchVoteHistory?: () => Promise<void>
): BroadcastQueryResult {
  const broadcastQuery = useCallback(
    async (query: string, options: BroadcastQueryOptions = {}) => {
      console.log("[useBroadcastQuery] Received query with options:", {
        query,
        queryMode: options.queryMode,
        queriesRequested: options.queriesRequested,
        csrfToken: options.csrfToken ? "[REDACTED]" : undefined,
      });

      try {
        const response = await fetch("/api/broadcast-query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(options.csrfToken && { "X-CSRF-Token": options.csrfToken }),
          },
          body: JSON.stringify({
            queryText: query,
            queryMode: options.queryMode,
            queriesRequested: options.queriesRequested,
          }),
          credentials: "include",
        });

        console.log("[useBroadcastQuery] Sent request with body:", {
          queryText: query,
          queryMode: options.queryMode,
          queriesRequested: options.queriesRequested,
        });

        const voteResult = await response.json();

        console.log("[useBroadcastQuery] Broadcast query response:", {
          status: response.status,
          url: response.url,
          headers: Object.fromEntries(response.headers),
          body: voteResult,
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        if ("error" in voteResult) {
          throw new Error(voteResult.error);
        }

        setLastVoteResult(voteResult as VoteResult);
        setVoteHistory((prevHistory: VoteResult[]) => {
          const newHistory = [voteResult as VoteResult, ...prevHistory].slice(
            0,
            RESULT_QUERIES_CARDS
          );
          console.log(
            "[useBroadcastQuery] Updating voteHistory:",
            newHistory.length,
            "items"
          );
          return newHistory;
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
        await refetchWithRetry(1, fetchVoteHistory, refetchNetworkState);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("[useBroadcastQuery] Error:", sanitizeError(error), {
          query,
          queryMode: options.queryMode,
          queriesRequested: options.queriesRequested,
        });
        throw error;
      }
    },
    [setVoteHistory, setLastVoteResult, refetchNetworkState, fetchVoteHistory]
  );

  return { broadcastQuery };
}
