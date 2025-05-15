"use client";

import React from "react";
import Link from "next/link";
import { VoteResult, Validator } from "@/lib/types";
import { ValidatorProfile } from "@/components/validator-profile";
import { parseRationale } from "@/lib/utils";

interface VoteHistoryProps {
  voteHistory: VoteResult[];
}

export function VoteHistory({ voteHistory }: VoteHistoryProps) {
  const [expandedVoteId, setExpandedVoteId] = React.useState<number | null>(
    null,
  );
  const [selectedValidator, setSelectedValidator] =
    React.useState<Validator | null>(null);

  // Handle view button click to expand/collapse vote details
  const handleViewClick = (index: number) => {
    setExpandedVoteId(expandedVoteId === index ? null : index);
  };

  // Handle click on validator name to show profile
  const handleValidatorClick = (validator: {
    id: string;
    provider: string;
    profileName: string;
    vote: string;
    rationale?: string;
  }) => {
    // Create a validator profile from the response data
    const validatorProfile: Validator = {
      id: validator.id,
      publicKey: validator.id, // Using ID as public key since we don't have it in responses
      provider: validator.provider,
      profileName: validator.profileName,
      modelName: "", // Default, as not provided in responses
      description: null,
      avatarUrl: null,
      validatorType: null,
      reliability: null,
      totalVotes: 0,
      correctVotes: 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isLeader: false,
      lastVote: validator.vote.toLowerCase() === "yes" ? true : validator.vote.toLowerCase() === "no" ? false : null,
      lastRationale: validator.rationale || null,
    };

    // Set the selected validator for profile display
    setSelectedValidator(validatorProfile);
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

  // Log vote history for debugging
  React.useEffect(() => {
    if (voteHistory) {
      console.log(`UI: Vote history length: ${voteHistory.length}`);
    }
  }, [voteHistory]);

  if (!voteHistory || voteHistory.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Vote History</h3>
        <p className="text-gray-500">No votes recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
          Vote History ({voteHistory.length})
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Historical voting sessions and their outcomes
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/70">
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
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {voteHistory.flatMap((vote, index) => {
              // Determine consensus text based on consensusValue
              let consensusText = "Tie";
              if (vote.isConsensusReached) {
                if (vote.consensusValue === true) {
                  consensusText = "Yes";
                } else if (vote.consensusValue === false) {
                  consensusText = "No";
                }
              }

              // Create an array of row elements for each vote (main row + optional details row)
              const rows = [];

              // Add the main vote row
              rows.push(
                <tr
                  key={`vote-row-${index}`}
                  className={
                    index % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/50" : ""
                  }
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {formatTime(vote.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                    {vote.queryText}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {vote?.votingResult?.yes || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
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
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
                </tr>,
              );

              // Add details row if expanded
              if (expandedVoteId === index) {
                rows.push(
                  <tr key={`vote-details-${index}`}>
                    <td
                      colSpan={7}
                      className="px-4 py-4 bg-gray-100 dark:bg-gray-800"
                    >
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Validator Responses:
                        </h3>
                        <div className="grid gap-2">
                          {vote.validatorResponses.map((validator, idx) => (
                            <div
                              key={`validator-${index}-${idx}`}
                              className="p-2 rounded border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex justify-between items-center">
                                <button
                                  onClick={() =>
                                    handleValidatorClick(validator)
                                  }
                                  className="font-medium text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                >
                                  {validator.profileName}
                                  <span className="text-gray-500 ml-1">
                                    ({validator.provider})
                                  </span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 ml-1 opacity-70"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
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
                              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                                {parseRationale(validator?.rationale)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>,
                );
              }

              return rows;
            })}
          </tbody>
        </table>
      </div>

      {/* Validator profile modal */}
      <ValidatorProfile
        validator={selectedValidator}
        isOpen={selectedValidator !== null}
        onClose={() => setSelectedValidator(null)}
      />
    </div>
  );
}