"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { VoteResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import {
  MAX_VOTE_HISTORY_RESULTS,
  RECENT_HISTORY_RESULTS,
} from "@/lib/constants";
import { parseRationale } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface VoteHistoryTableProps {
  validatorId: string;
}

interface VoteStats {
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  consensusMatchPercentage: number;
  nonConsensusPercentage: number;
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
    <div className="mt-8">
      {stats && (
        <div className="flex flex-col space-y-4 py-4 border-y-2 border-0 justify-center items-center">
          <h2 className="text-lg text-center font-semibold text-zinc-800 dark:text-zinc-200">
            Vote Statistics {isRecentActive ? "(Recent)" : "(All)"}
            {voteFilter ? ` (Filtered: ${voteFilter})` : ""}
          </h2>
          <div className="flex flex-wrap text-center gap-8 w-[50%] md:w-full justify-center border-0">
            <div className="w-full sm:w-auto justify-center">
              <p className="text-2xl text-center font-semibold text-zinc-800 dark:text-zinc-200">
                {stats.totalVotes}
              </p>
              <h3 className="text-sm text-center text-zinc-600 dark:text-zinc-300">
                Total Votes
              </h3>
            </div>
            <div className="w-full sm:w-auto">
              <button
                onClick={handleYesClick}
                className="block w-full text-center cursor-pointer"
                aria-pressed={isYesActive}
                aria-label="Toggle filter for YES votes"
              >
                <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
                  {stats.yesVotes}
                </p>
                <h3 className="text-sm text-zinc-600 dark:text-zinc-300 flex justify-center items-center gap-1">
                  {isYesActive && (
                    <span className="inline-block w-2 h-2 bg-teal-500"></span>
                  )}
                  YES Votes
                </h3>
              </button>
            </div>
            <div className="w-full sm:w-auto">
              <button
                onClick={handleNoClick}
                className="block w-full text-center cursor-pointer"
                aria-pressed={isNoActive}
                aria-label="Toggle filter for NO votes"
              >
                <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
                  {stats.noVotes}
                </p>
                <h3 className="text-sm text-zinc-600 dark:text-zinc-400 flex justify-center items-center gap-1">
                  {isNoActive && (
                    <span className="inline-block w-2 h-2 bg-teal-500"></span>
                  )}
                  NO Votes
                </h3>
              </button>
            </div>
            <div className="w-full sm:w-auto">
              <p className="text-2xl text-center font-semibold text-zinc-800 dark:text-zinc-200">
                {Math.round(stats.consensusMatchPercentage)}%
              </p>
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Reliability
              </h3>
            </div>
            <div className="w-full sm:w-auto">
              <p className="text-2xl text-center font-semibold text-zinc-800 dark:text-zinc-200">
                {Math.round(stats.consensusMatchPercentage)}%
              </p>
              <h3 className="text-sm text-center font-medium text-zinc-600 dark:text-zinc-400">
                Consensus
              </h3>
            </div>
            <div className="w-full sm:w-auto">
              <p className="text-2xl text-center font-semibold text-zinc-800 dark:text-zinc-200">
                {Math.round(stats.nonConsensusPercentage)}%
              </p>
              <h3 className="text-sm text-center font-medium text-zinc-600 dark:text-zinc-400">
                Non-Consensus
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 mt-4">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Vote History ({filteredHistory.length})
        </h3>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleYesClick}
            className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
            aria-pressed={isYesActive}
          >
            {isYesActive && (
              <span className="inline-block w-2 h-2 bg-teal-500 mr-1"></span>
            )}
            Yes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNoClick}
            className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
            aria-pressed={isNoActive}
          >
            {isNoActive && (
              <span className="inline-block w-2 h-2 bg-teal-500 mr-1"></span>
            )}
            No
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecentClick}
            className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
            aria-pressed={isRecentActive}
          >
            {isRecentActive && (
              <span className="inline-block w-2 h-2 bg-teal-500 mr-1"></span>
            )}
            Recent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAllClick}
            className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
            aria-pressed={isAllActive}
          >
            {isAllActive && (
              <span className="inline-block w-2 h-2 bg-teal-500 mr-1"></span>
            )}
            All
          </Button>
        </div>
      </div>
      {isLoading ? (
        <LoadingSpinner type="beat" message="Loading vote history..." />
      ) : filteredHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-700">
              <tr>
                <th className="px-4 py-2 w-8"></th>
                <th className="px-4 py-2">Query Text</th>
                <th className="px-4 py-2">Vote</th>
                <th className="px-4 py-2">Rationale</th>
                <th className="px-4 py-2">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((vote, index) => {
                if (process.env.NODE_ENV === "development") {
                  console.log(`Rendering vote ${index}:`, {
                    voteId: vote.id,
                    queryText: vote.queryText,
                    response: vote.validatorResponses,
                    timestamp: vote.timestamp,
                  });
                }
                const response = vote.validatorResponses[0];
                return (
                  <tr
                    key={vote.id}
                    className="border-b dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2">
                      <Link
                        href={`/ask/${vote.id}`}
                        className="block w-full h-full flex items-center"
                        aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                      >
                        <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/ask/${vote.id}`}
                        className="block w-full h-full"
                        aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                      >
                        {vote.queryText}
                      </Link>
                    </td>
                    <td
                      className={`px-4 py-2 ${response.vote === "NO" ? "text-red-600 dark:text-red-400" : "text-teal-600 dark:text-teal-400"}`}
                    >
                      <Link
                        href={`/ask/${vote.id}`}
                        className="block w-full h-full"
                        aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                      >
                        {response.vote}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/ask/${vote.id}`}
                        className="block w-full h-full"
                        aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                      >
                        {parseRationale(response.rationale)}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/ask/${vote.id}`}
                        className="block w-full h-full"
                        aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                      >
                        {vote.timestamp
                          ? new Date(vote.timestamp).toLocaleString()
                          : "N/A"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            {isRecentActive
              ? `Showing the most recent ${RECENT_HISTORY_RESULTS} results.`
              : `This is currently capped at ${MAX_VOTE_HISTORY_RESULTS} results.`}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {voteFilter
            ? `No ${voteFilter} votes found for this validator.`
            : "No vote history available for this validator."}
        </p>
      )}
    </div>
  );
}