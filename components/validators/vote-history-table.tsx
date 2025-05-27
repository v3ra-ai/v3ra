"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { VoteResult, VoteStats } from "@/lib/types";
import { MAX_VOTE_HISTORY_RESULTS, RECENT_HISTORY_RESULTS } from "@/lib/constants";
import VoteStatistics from "./vote-statistics";
import FilterControls from "./filter-controls";
import HistoryTable from "./history-table";

interface VoteHistoryTableProps {
  validatorId: string;
}

export default function VoteHistoryTable({
  validatorId,
}: VoteHistoryTableProps) {
  const [voteHistory, setVoteHistory] = useState<VoteResult[]>([]);
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [limit, setLimit] = useState<number>(RECENT_HISTORY_RESULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [voteFilter, setVoteFilter] = useState<"YES" | "NO" | null>(null);

  const fetchVoteData = useCallback(
    async (fetchLimit: number) => {
      setIsLoading(true);
      try {
        const effectiveLimit =
          fetchLimit === 0
            ? MAX_VOTE_HISTORY_RESULTS
            : Math.min(fetchLimit, MAX_VOTE_HISTORY_RESULTS);
        const [historyResponse, statsResponse] = await Promise.all([
          fetch(
            `/api/validators/votes?validatorId=${encodeURIComponent(validatorId)}&limit=${effectiveLimit}`
          ),
          fetch(
            `/api/validators/vote-stats?validatorId=${encodeURIComponent(validatorId)}&limit=${effectiveLimit}`
          ),
        ]);

        if (!historyResponse.ok) {
          const errorText = await historyResponse.text();
          throw new Error(
            `Failed to fetch vote history: ${historyResponse.status} ${historyResponse.statusText} - ${errorText}`
          );
        }
        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          throw new Error(
            `Failed to fetch vote stats: ${statsResponse.status} ${statsResponse.statusText} - ${errorText}`
          );
        }

        const historyData: VoteResult[] = await historyResponse.json();
        const statsData: VoteStats = await statsResponse.json();

        setVoteHistory(historyData);
        setStats(statsData);

        if (process.env.NODE_ENV === "development") {
          console.log(
            `Fetched vote history for validator ${validatorId}:`,
            historyData
          );
          console.log(
            `Fetched vote stats for validator ${validatorId}:`,
            statsData
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error(
          `Error fetching vote data for validator ${validatorId}:`,
          errorMessage
        );
        setVoteHistory([]);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    },
    [validatorId]
  );

  useEffect(() => {
    fetchVoteData(limit);
  }, [limit, fetchVoteData]);

  const handleAllClick = () => {
    setLimit(0);
  };

  const handleRecentClick = () => {
    setLimit(RECENT_HISTORY_RESULTS);
  };

  const handleYesClick = () => {
    setVoteFilter((prev) => (prev === "YES" ? null : "YES"));
  };

  const handleNoClick = () => {
    setVoteFilter((prev) => (prev === "NO" ? null : "NO"));
  };

  const isRecentActive = limit === RECENT_HISTORY_RESULTS;
  const isAllActive = limit === 0;
  const isYesActive = voteFilter === "YES";
  const isNoActive = voteFilter === "NO";

  const filteredHistory = useMemo(() => {
    if (!voteFilter) return voteHistory;
    return voteHistory.filter(
      (vote) => vote.validatorResponses[0]?.vote === voteFilter
    );
  }, [voteHistory, voteFilter]);

  return (
    <div className="mt-2">
      {stats && (
        <VoteStatistics
          stats={stats}
          isRecentActive={isRecentActive}
          voteFilter={voteFilter}
          isYesActive={isYesActive}
          isNoActive={isNoActive}
          handleYesClick={handleYesClick}
          handleNoClick={handleNoClick}
        />
      )}
      <div className="flex items-center justify-between mb-4 mt-4">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Vote History ({filteredHistory.length})
        </h3>
        <FilterControls
          isYesActive={isYesActive}
          isNoActive={isNoActive}
          isRecentActive={isRecentActive}
          isAllActive={isAllActive}
          handleYesClick={handleYesClick}
          handleNoClick={handleNoClick}
          handleRecentClick={handleRecentClick}
          handleAllClick={handleAllClick}
        />
      </div>
      <HistoryTable
        isLoading={isLoading}
        filteredHistory={filteredHistory}
        isRecentActive={isRecentActive}
        voteFilter={voteFilter}
      />
    </div>
  );
}