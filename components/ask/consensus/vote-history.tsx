"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQueryStore } from "@/store/query-store";
import { fetchVoteHistory } from "@/app/actions";

export default function ValidatorVoteHistory() {
  const { voteHistory, queryMode, setVoteHistory } = useQueryStore();
  const [voteHistoryError, setVoteHistoryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVoteId, setExpandedVoteId] = useState<number | null>(null);

  useEffect(() => {
    async function loadVoteHistory() {
      try {
        setIsLoading(true);
        const result = await fetchVoteHistory();
        if ("error" in result) {
          console.error("Fetch vote history failed:", result.error);
          setVoteHistoryError(result.error);
          return;
        }
        setVoteHistory(result);
        setVoteHistoryError(null);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load vote history";
        console.error("Error in loadVoteHistory:", errorMessage);
        setVoteHistoryError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
    loadVoteHistory();
  }, [setVoteHistory]);

  // Handle view or query click to expand/collapse vote details
  const handleViewClick = (index: number) => {
    setExpandedVoteId(expandedVoteId === index ? null : index);
  };

  // Format timestamp for display
  const formatTime = (timestamp: string | number | undefined) => {
    if (!timestamp) return "N/A";
    const date =
      typeof timestamp === "string"
        ? new Date(timestamp)
        : new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 max-w-6xl mx-auto">
        <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
          Validator Vote History
        </h3>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-24 flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (voteHistoryError) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 max-w-6xl mx-auto">
        <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
          Validator Vote History
        </h3>
        <p className="text-red-500">{voteHistoryError}</p>
      </div>
    );
  }

  if (!voteHistory || voteHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-4 max-w-6xl mx-auto">
        <h3 className="text-lg font-medium text-gray-800 dark:text-zinc-200 mb-2">
          Validator Vote History
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No votes recorded yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 shadow rounded-xl max-w-6xl mx-auto">
      <div className="px-4 py-5 sm:px-6 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-medium leading-6 text-gray-800 dark:text-zinc-200">
          Validator Vote History ({voteHistory.length})
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Historical voting sessions and their outcomes
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Query
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Mode
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Yes Votes
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                No Votes
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Consensus
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Details
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Discussion
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {voteHistory.flatMap((vote, index) => {
              let consensusText = "Tie";
              if (vote.isConsensusReached) {
                if (vote.consensusValue === true) {
                  consensusText = "Yes";
                } else if (vote.consensusValue === false) {
                  consensusText = "No";
                }
              }

              const rows = [];

              rows.push(
                <tr
                  key={`vote-row-${index}`}
                  className={
                    index % 2 === 0 ? "bg-zinc-50 dark:bg-zinc-800" : ""
                  }
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200">
                    {formatTime(vote.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200 max-w-[200px]">
                    <span
                      className={`cursor-pointer inline-block max-w-full ${
                        expandedVoteId === index
                          ? "whitespace-normal"
                          : "truncate"
                      }`}
                      onClick={() => handleViewClick(index)}
                      title={vote.queryText}
                    >
                      {vote.queryText}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200">
                    {queryMode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200">
                    {vote?.votingResult?.yes || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200">
                    {vote?.votingResult?.no || 0}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        consensusText === "Yes"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : consensusText === "No"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {consensusText}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                      onClick={() => handleViewClick(index)}
                    >
                      {expandedVoteId === index ? "Hide" : "View"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/vote-sessions/${vote.id}`}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Discuss
                    </Link>
                  </td>
                </tr>
              );

              if (expandedVoteId === index) {
                rows.push(
                  <tr key={`vote-details-${index}`}>
                    <td
                      colSpan={8}
                      className="px-4 py-4 bg-zinc-100 dark:bg-zinc-800"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                            Query:
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-zinc-200">
                            {vote.queryText}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                            Validator Responses:
                          </h3>
                          <div className="grid gap-2">
                            {vote.validatorResponses.map((validator, idx) => (
                              <div
                                key={`validator-${index}-${idx}`}
                                className="p-2 rounded border border-zinc-200 dark:border-zinc-700"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-sm text-gray-700 dark:text-zinc-200 flex items-center">
                                    {validator.profileName}
                                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                                      ({validator.provider})
                                    </span>
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      validator &&
                                      validator.vote &&
                                      validator.vote.toLowerCase &&
                                      validator.vote.toLowerCase() === "yes"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                                  >
                                    {validator?.vote || "No Vote"}
                                  </span>
                                </div>
                                <div className="mt-2 text-sm text-gray-700 dark:text-zinc-200">
                                  {validator?.rationale ||
                                    "No rationale provided"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              return rows;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
