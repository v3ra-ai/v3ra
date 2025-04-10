"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { VoteResult } from "@/lib/types";

interface ConsensusVisualizationProps {
  voteResult: VoteResult | null;
  isVoting: boolean;
}

export function ConsensusVisualization({
  voteResult,
  isVoting,
}: ConsensusVisualizationProps) {
  const [, setAnimateVotes] = useState(false);

  useEffect(() => {
    if (isVoting) {
      setAnimateVotes(true);
    } else {
      setAnimateVotes(false);
    }
  }, [isVoting]);

  const totalVotes = voteResult?.votingResult
    ? (voteResult.votingResult.yes ?? 0) +
      (voteResult.votingResult.no ?? 0) +
      (voteResult.votingResult.notVoted ?? 0)
    : 0;

  const yesPercentage = voteResult?.votingResult
    ? ((voteResult.votingResult.yes ?? 0) / totalVotes) * 100
    : 0;
  const noPercentage = voteResult?.votingResult
    ? ((voteResult.votingResult.no ?? 0) / totalVotes) * 100
    : 0;
  const notVotedPercentage = voteResult?.votingResult
    ? ((voteResult.votingResult.notVoted ?? 0) / totalVotes) * 100
    : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Consensus Status
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Current query */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Current Query
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white font-medium">
              {voteResult?.queryText || "No active query"}
            </p>
          </div>
        </div>

        {/* Vote meter */}
        <div>
          <div className="flex justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Vote Distribution
            </h3>
            {isVoting && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mr-1 h-2 w-2 rounded-full bg-purple-400"
                ></motion.span>
                Voting in progress...
              </span>
            )}
          </div>

          <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Yes votes */}
            <motion.div
              className="h-full bg-green-500 float-left flex items-center justify-center"
              initial={{ width: "0%" }}
              animate={{ width: `${yesPercentage}%` }}
              transition={{ duration: 1 }}
            >
              {yesPercentage > 15 && (
                <span className="text-xs font-bold text-white px-2">YES</span>
              )}
            </motion.div>

            {/* No votes */}
            <motion.div
              className="h-full bg-red-500 float-left flex items-center justify-center"
              initial={{ width: "0%" }}
              animate={{ width: `${noPercentage}%` }}
              transition={{ duration: 1 }}
            >
              {noPercentage > 15 && (
                <span className="text-xs font-bold text-white px-2">NO</span>
              )}
            </motion.div>

            {/* Not voted */}
            <motion.div
              className="h-full bg-gray-400 float-left flex items-center justify-center"
              initial={{ width: "0%" }}
              animate={{ width: `${notVotedPercentage}%` }}
              transition={{ duration: 1 }}
            >
              {notVotedPercentage > 15 && (
                <span className="text-xs font-bold text-white px-2">
                  PENDING
                </span>
              )}
            </motion.div>
          </div>

          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <div>Yes: {voteResult?.votingResult?.yes ?? 0}</div>
            <div>No: {voteResult?.votingResult?.no ?? 0}</div>
            <div>Pending: {voteResult?.votingResult?.notVoted ?? 0}</div>
          </div>
        </div>

        {/* Final result */}
        {voteResult?.isConsensusReached && !isVoting && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Consensus Result
            </h3>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex items-center justify-center p-4 rounded-lg ${
                voteResult?.consensusValue
                  ? "bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800"
                  : "bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800"
              }`}
            >
              <span
                className={`text-xl mr-2 ${
                  voteResult?.consensusValue ? "text-green-500" : "text-red-500"
                }`}
              >
                {voteResult?.consensusValue ? "✓" : "✗"}
              </span>
              <span
                className={`font-bold text-lg ${
                  voteResult?.consensusValue
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {voteResult?.consensusValue ? "YES" : "NO"}
              </span>
            </motion.div>
          </div>
        )}

        {/* Simulated votes (when in voting state) */}
        {isVoting && (
          <div className="grid grid-cols-5 gap-2 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-2 rounded-full bg-gray-300 dark:bg-gray-700"
                animate={{
                  backgroundColor: [
                    "rgb(209 213 219)", // gray-300
                    Math.random() > 0.5 ? "rgb(34 197 94)" : "rgb(239 68 68)", // green-500 or red-500
                    "rgb(209 213 219)", // back to gray-300
                  ],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
