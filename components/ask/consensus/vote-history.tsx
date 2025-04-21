"use client";

import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
import { useQueryStore } from "@/store/query-store";
import { fetchVoteHistory } from "@/app/actions";
import VoteHistoryHeader from "@/components/ask/consensus/vote-history-header";
import VoteHistoryTable from "@/components/ask/consensus/vote-history-table";
import VoteHistoryLoading from "@/components/ask/consensus/vote-history-loading";
import VoteHistoryError from "@/components/ask/consensus/vote-history-error";
import VoteHistoryEmpty from "@/components/ask/consensus/vote-history-empty";
import { Button } from "@/components/ui/button";
import type { VoteResult } from "@/lib/types";

// Compare voteHistory by IDs only
const areVoteHistoriesEqual = (a: VoteResult[], b: VoteResult[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item.id === b[index].id);
};

// Debounce function with specific type for loadVoteHistory
function debounce(
  func: (isInitialLoad?: boolean) => Promise<void>,
  wait: number
): (isInitialLoad?: boolean) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (isInitialLoad?: boolean) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(isInitialLoad), wait);
  };
}

// Memoize VoteHistory
const VoteHistory = memo(() => {
  const { voteHistory, setVoteHistory, queryMode, lastVoteResult } = useQueryStore();
  const [voteHistoryError, setVoteHistoryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVoteId, setExpandedVoteId] = useState<number | null>(null);
  const isMounted = useRef(false);
  const renderCount = useRef(0);
  const mountCount = useRef(0);

  // Track mount and render counts
  mountCount.current += isMounted.current ? 0 : 1;
  renderCount.current += 1;
  console.log(
    "[VoteHistory] Mount count:",
    mountCount.current,
    "Render count:",
    renderCount.current,
    "voteHistory length:",
    voteHistory?.length,
    "queryMode:",
    queryMode
  );

  // Memoize voteHistory and queryMode
  const memoizedVoteHistory = useMemo(() => voteHistory || [], [voteHistory]);
  const memoizedQueryMode = useMemo(() => queryMode, [queryMode]);

  console.log(
    "[VoteHistory] Component mounted or re-rendered, voteHistory length:",
    memoizedVoteHistory.length,
    "queryMode:",
    memoizedQueryMode
  );

  const loadVoteHistory = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      console.log("[VoteHistory] Fetching vote history via fetchVoteHistory, isInitialLoad:", isInitialLoad);
      const result = await fetchVoteHistory();
      if ("error" in result) {
        console.error("[VoteHistory] Fetch vote history failed:", result.error);
        setVoteHistoryError(result.error);
        return;
      }
      console.log("[VoteHistory] Fetch result:", result);
      if (!areVoteHistoriesEqual(result, memoizedVoteHistory)) {
        console.log("[VoteHistory] Setting voteHistory with", result.length, "items");
        setVoteHistory([...result]);
      } else {
        console.log("[VoteHistory] No change in voteHistory, skipping setVoteHistory");
      }
      setVoteHistoryError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load vote history";
      console.error("[VoteHistory] Error in loadVoteHistory:", errorMessage);
      setVoteHistoryError(errorMessage);
    } finally {
      if (isInitialLoad) {
        console.log("[VoteHistory] Fetch complete, isLoading set to false");
        setIsLoading(false);
      }
    }
  }, [memoizedVoteHistory, setVoteHistory]);

  // Inline debouncedLoadVoteHistory to avoid useCallback dependency issues
  const debouncedLoadVoteHistory = debounce(loadVoteHistory, 1000);

  // Initial fetch on mount
  useEffect(() => {
    if (isMounted.current) {
      console.log("[VoteHistory] Skipping effect due to mount state");
      return;
    }
    isMounted.current = true;
    console.log("[VoteHistory] Effect running, initial load");
    loadVoteHistory(true);

    return () => {
      console.log("[VoteHistory] Cleaning up mount state");
      isMounted.current = false;
    };
  }, [loadVoteHistory]);

  // Fetch on query submission
  useEffect(() => {
    if (lastVoteResult) {
      console.log("[VoteHistory] New vote result detected, triggering debounced loadVoteHistory");
      debouncedLoadVoteHistory();
    }
  }, [lastVoteResult, debouncedLoadVoteHistory, loadVoteHistory]);

  const handleRefresh = () => {
    console.log("[VoteHistory] Manual refresh triggered");
    loadVoteHistory(true);
  };

  const handleViewClick = (index: number) => {
    console.log("[VoteHistory] Toggling expandedVoteId:", index);
    setExpandedVoteId((prev) => (prev === index ? null : index));
  };

  console.log(
    "[VoteHistory] Rendering with voteHistory length:",
    memoizedVoteHistory.length,
    "isLoading:",
    isLoading,
    "error:",
    voteHistoryError
  );

  if (isLoading) {
    return <VoteHistoryLoading />;
  }

  if (voteHistoryError) {
    return <VoteHistoryError error={voteHistoryError} />;
  }

  if (!memoizedVoteHistory || memoizedVoteHistory.length === 0) {
    return <VoteHistoryEmpty />;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 shadow rounded-xl max-w-6xl mx-auto">
      <div className="flex justify-between items-center p-4">
        <VoteHistoryHeader voteCount={memoizedVoteHistory.length} />
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      <VoteHistoryTable
        voteHistory={memoizedVoteHistory}
        expandedVoteId={expandedVoteId}
        handleViewClick={handleViewClick}
        queryMode={memoizedQueryMode}
      />
    </div>
  );
});

VoteHistory.displayName = "VoteHistory";

export default VoteHistory;