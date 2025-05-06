"use client";

import { useNetworkState } from "@/hooks/useNetworkState";
import { VoteResultContext } from "@/components/ask/ask-results-expert";
import { useContext } from "react";
import { motion } from "framer-motion";
import { sanitizeQueryText } from "@/utils/security-utils";
import { calculateVotePercentages } from "@/utils/vote-utils";
import { formatErrorMessage } from "@/utils/error-utils";
import { LoadingSpinner } from "@/components/loading-spinner-new";

const QueryState = ({ state }: { state: "loading" | { error: string } }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
    <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
      Current Query
    </h3>
    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-40 w-full flex items-center justify-center">
      {state === "loading" ? (
        <span className="">
          <LoadingSpinner type="beat" message="Loading query..." />
        </span>
      ) : (
        <span className="text-red-500">
          Error: {formatErrorMessage(state.error)}
        </span>
      )}
    </div>
  </div>
);

export default function CurrentQuery() {
  const { isLoading, error } = useNetworkState();
  const voteResult = useContext(VoteResultContext);

  if (isLoading) {
    return <QueryState state="loading" />;
  }

  if (error) {
    return <QueryState state={{ error: formatErrorMessage(error) }} />;
  }
  // Sanitize queryText to prevent XSS
  const sanitizedQueryText =
    sanitizeQueryText(voteResult?.queryText) ||  <LoadingSpinner type="beat" message="Loading query..." />;

  const {
    yes: yesPercentage,
    no: noPercentage,
    notVoted: notVotedPercentage,
  } = calculateVotePercentages(voteResult);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
      <h3 className="text-xl font-medium text-gray-800 dark:text-zinc-200 mb-4">
        Current Query
      </h3>
      <div className="space-y-4">
        <div className="text-2xl text-gray-600 dark:text-gray-300">
          {sanitizedQueryText}
        </div>
        <div
          className={`
            h-8 w-full
            bg-gray-200 dark:bg-zinc-700
            rounded-full overflow-hidden
            flex
          `}
        >
          {yesPercentage > 0 && (
            <motion.div
              className="h-full bg-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${yesPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
          {noPercentage > 0 && (
            <motion.div
              className="h-full bg-red-400"
              initial={{ width: 0 }}
              animate={{ width: `${noPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
          {notVotedPercentage > 0 && (
            <motion.div
              className="h-full bg-gray-400 dark:bg-zinc-600"
              initial={{ width: 0 }}
              animate={{ width: `${notVotedPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
        </div>
        <div className="flex justify-between text-md text-gray-600 dark:text-gray-300">
          <span>Yes: {yesPercentage.toFixed(0)}%</span>
          <span>No: {noPercentage.toFixed(0)}%</span>
          <span>Not Voted: {notVotedPercentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
