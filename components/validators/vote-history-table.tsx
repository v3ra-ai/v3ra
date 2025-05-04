"use client";

import { useState, useEffect } from "react";
import { VoteResult } from "@/lib/types";
import { Button } from "@/components/ui/button";

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

export default function VoteHistoryTable({ validatorId }: VoteHistoryTableProps) {
  const [voteHistory, setVoteHistory] = useState<VoteResult[]>([]);
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [limit, setLimit] = useState<number>(50); // Default to 50 for "Recent"
  const [isLoading, setIsLoading] = useState(true);

  const fetchVoteData = async (fetchLimit: number) => {
    setIsLoading(true);
    try {
      const effectiveLimit = fetchLimit === 0 ? 300 : Math.min(fetchLimit, 300); // Enforce max limit of 300
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`/api/validators/votes?validatorId=${encodeURIComponent(validatorId)}&limit=${effectiveLimit}`),
        fetch(`/api/validators/vote-stats?validatorId=${encodeURIComponent(validatorId)}&limit=${effectiveLimit}`)
      ]);

      if (!historyResponse.ok) {
        const errorText = await historyResponse.text();
        throw new Error(`Failed to fetch vote history: ${historyResponse.status} ${historyResponse.statusText} - ${errorText}`);
      }
      if (!statsResponse.ok) {
        const errorText = await statsResponse.text();
        throw new Error(`Failed to fetch vote stats: ${statsResponse.status} ${statsResponse.statusText} - ${errorText}`);
      }

      const historyData = await historyResponse.json();
      const statsData = await statsResponse.json();

      setVoteHistory(historyData);
      setStats(statsData);

      if (process.env.NODE_ENV === "development") {
        console.log(`Fetched vote history for validator ${validatorId}:`, historyData);
        console.log(`Fetched vote stats for validator ${validatorId}:`, statsData);
      }
    } catch (error) {
      console.error(`Error fetching vote data for validator ${validatorId}:`, error);
      setVoteHistory([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoteData(limit);
  }, [limit]);

  const handleAllClick = () => {
    setLimit(0); // Fetch all votes (up to 300)
  };

  const handleRecentClick = () => {
    setLimit(50); // Fetch last 50 votes
  };

  return (
    <div className="mt-8">
      {stats && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
            Vote Statistics
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold">Total Votes: </span>
            {stats.totalVotes}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold">YES Votes: </span>
            {stats.yesVotes}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold">NO Votes: </span>
            {stats.noVotes}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold">Reliability Rating: </span>
            {stats.consensusMatchPercentage}%
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold">Consensus Match: </span>
            {stats.consensusMatchPercentage}%
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold">Non-Consensus: </span>
            {stats.nonConsensusPercentage}%
          </p>
        </div>
      )}
      <div className="flex items-center justify-between mb-4 mt-4">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Vote History ({voteHistory.length})
        </h3>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAllClick}
            className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecentClick}
            className="text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600 cursor-pointer"
          >
            Recent
          </Button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading vote history...</p>
      ) : voteHistory.length > 0 ? (
        <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300">
          <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-700">
            <tr>
              <th className="px-4 py-2">Query Text</th>
              <th className="px-4 py-2">Vote</th>
              <th className="px-4 py-2">Rationale</th>
              <th className="px-4 py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {voteHistory.map((vote, index) => {
              // Log each vote for debugging
              if (process.env.NODE_ENV === "development") {
                console.log(`Rendering vote ${index}:`, {
                  voteId: vote.id,
                  queryText: vote.queryText,
                  response: vote.validatorResponses,
                  timestamp: vote.timestamp,
                });
              }
              const response = vote.validatorResponses[0]; // Single response for this validator
              return (
                <tr
                  key={vote.id}
                  className="border-b dark:border-zinc-600"
                >
                  <td className="px-4 py-2">{vote.queryText}</td>
                  <td className="px-4 py-2">{response.vote}</td>
                  <td className="px-4 py-2">{response.rationale}</td>
                  <td className="px-4 py-2">
                    {vote.timestamp
                      ? new Date(vote.timestamp).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No vote history available for this validator.
        </p>
      )}
    </div>
  );
}