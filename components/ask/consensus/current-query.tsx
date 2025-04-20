// components/ask/consensus/current-query.tsx
"use client";

import { motion } from "framer-motion";
import { useNetworkState } from "@/hooks/useNetworkState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { VoteResult } from "@/lib/types";

interface CurrentQueryProps {
  voteResult: VoteResult | null;
}

export default function CurrentQuery({ voteResult }: CurrentQueryProps) {
  const { isLoading, error, networkState } = useNetworkState();
  const isVoting = networkState?.isVoting || false;

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

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
        <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
          Current Query
        </h3>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-40 w-full flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
        <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
          Current Query
        </h3>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-40 w-full flex items-center justify-center">
          <span className="text-red-500">Error: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 w-full">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-md font-medium text-gray-800 dark:text-zinc-200">
          Current Query
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        {/* Current Query */}
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Query Text
          </h4>
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-4">
            <p className="text-gray-800 dark:text-zinc-200 font-medium">
              {voteResult?.queryText || "No active query"}
            </p>
          </div>
        </div>

        {/* Vote Distribution */}
        <div>
          <div className="flex justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Vote Distribution
            </h4>
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
          <div className="h-8 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
            <motion.div
              className="h-full bg-green-500 flex items-center justify-center"
              initial={{ width: "0%" }}
              animate={{ width: `${yesPercentage}%` }}
              transition={{ duration: 1 }}
            >
              {yesPercentage > 15 && (
                <span className="text-xs font-bold text-white px-2">YES</span>
              )}
            </motion.div>
            <motion.div
              className="h-full bg-red-500 flex items-center justify-center"
              initial={{ width: "0%" }}
              animate={{ width: `${noPercentage}%` }}
              transition={{ duration: 1 }}
            >
              {noPercentage > 15 && (
                <span className="text-xs font-bold text-white px-2">NO</span>
              )}
            </motion.div>
            <motion.div
              className="h-full bg-gray-400 flex items-center justify-center"
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
          <div className="flex flex-col sm:flex-row justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <div>Yes: {voteResult?.votingResult?.yes ?? 0}</div>
            <div>No: {voteResult?.votingResult?.no ?? 0}</div>
            <div>Pending: {voteResult?.votingResult?.notVoted ?? 0}</div>
          </div>
        </div>

        {/* Consensus Result */}
        {voteResult?.isConsensusReached && !isVoting && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Consensus Result
            </h4>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800"
            >
              {voteResult?.consensusValue ? (
                <Check className="text-green-500 mr-2" size={24} />
              ) : (
                <X className="text-red-500 mr-2" size={24} />
              )}
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

        {/* Voting Animation */}
        {isVoting && (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-2 rounded-full bg-gray-300 dark:bg-zinc-700"
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
      </CardContent>
    </Card>
  );
}