
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
import { areVoteHistoriesEqual } from "@/utils/vote-utils";
import { formatErrorMessage } from "@/utils/error-utils";



// Debug logging utility
const debugLog = (message: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[VoteHistory] ${message}`, ...args);
  }
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
  // State and memoization setup
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
  debugLog(
    "Mount count:",
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

  debugLog(
    "Component mounted or re-rendered, voteHistory length:",
    memoizedVoteHistory.length,
    "queryMode:",
    memoizedQueryMode
  );

  const loadVoteHistory = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      debugLog("Fetching vote history via fetchVoteHistory, isInitialLoad:", isInitialLoad);
      const result = await fetchVoteHistory();
      if ("error" in result) {
        debugLog("Fetch vote history failed:", result.error);
        setVoteHistoryError(formatErrorMessage(result.error));
        return;
      }
      debugLog("Fetch result:", result);
      if (!areVoteHistoriesEqual(result, memoizedVoteHistory)) {
        debugLog("Setting voteHistory with", result.length, "items");
        setVoteHistory([...result]);
      } else {
        debugLog("No change in voteHistory, skipping setVoteHistory");
      }
      setVoteHistoryError(null);
    } catch (err: unknown) {
      const errorMessage = formatErrorMessage(err, "Failed to load vote history");
      debugLog("Error in loadVoteHistory:", errorMessage);
      setVoteHistoryError(errorMessage);
    } finally {
      if (isInitialLoad) {
        debugLog("Fetch complete, isLoading set to false");
        setIsLoading(false);
      }
    }
  }, [memoizedVoteHistory, setVoteHistory]);

  // Inline debouncedLoadVoteHistory to avoid useCallback dependency issues
  const debouncedLoadVoteHistory = debounce(loadVoteHistory, 1000);

  // Effect handling for initial fetch and updates
  useEffect(() => {
    if (isMounted.current) {
      debugLog("Skipping effect due to mount state");
      return;
    }
    isMounted.current = true;
    debugLog("Effect running, initial load");
    loadVoteHistory(true);

    return () => {
      debugLog("Cleaning up mount state");
      isMounted.current = false;
    };
  }, [loadVoteHistory]);

  useEffect(() => {
    if (lastVoteResult) {
      debugLog("New vote result detected, triggering debounced loadVoteHistory");
      debouncedLoadVoteHistory();
    }
  }, [lastVoteResult, debouncedLoadVoteHistory, loadVoteHistory]);

  const handleRefresh = () => {
    debugLog("Manual refresh triggered");
    loadVoteHistory(true);
  };

  const handleViewClick = (index: number) => {
    debugLog("Toggling expandedVoteId:", index);
    setExpandedVoteId((prev) => (prev === index ? null : index));
  };

  // Rendering vote history table
  debugLog(
    "Rendering with voteHistory length:",
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
    return <VoteHistoryError error={voteHistoryError} onRetry={handleRefresh} />;
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