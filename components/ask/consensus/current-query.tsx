
"use client";

import { useNetworkState } from "@/hooks/useNetworkState";
import { VoteResultContext } from "@/components/ask/ask-results-expert";
import { VoteResult } from "@/lib/types";
import { useContext } from "react";
import { motion } from "framer-motion";
import DOMPurify from "dompurify";

const QueryState = ({ state }: { state: "loading" | { error: string } }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
    <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">Current Query</h3>
    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl h-40 w-full flex items-center justify-center">
      {state === "loading" ? (
        <span className="text-gray-400 dark:text-gray-500">Loading...</span>
      ) : (
        <span className="text-red-500">Error: {DOMPurify.sanitize(state.error)}</span>
      )}
    </div>
  </div>
);

const calculateVotePercentages = (voteResult: VoteResult | null) => {
  const totalVotes = voteResult?.votingResult
    ? (voteResult.votingResult.yes ?? 0) + (voteResult.votingResult.no ?? 0) + (voteResult.votingResult.notVoted ?? 0)
    : 0;
  return {
    yes: totalVotes ? ((voteResult?.votingResult?.yes ?? 0) / totalVotes) * 100 : 0,
    no: totalVotes ? ((voteResult?.votingResult?.no ?? 0) / totalVotes) * 100 : 0,
    notVoted: totalVotes ? ((voteResult?.votingResult?.notVoted ?? 0) / totalVotes) * 100 : 0,
  };
};

export default function CurrentQuery() {
  const { isLoading, error } = useNetworkState();
  const voteResult = useContext(VoteResultContext);

  if (isLoading) {
    return <QueryState state="loading" />;
  }

  if (error) {
    return <QueryState state={{ error: error.message }} />;
  }

  const { yes: yesPercentage, no: noPercentage, notVoted: notVotedPercentage } = calculateVotePercentages(voteResult);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 h-64 w-full">
      <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">Current Query</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">{voteResult?.queryText ?? "No query available"}</p>
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
              className="h-full bg-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${yesPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          )}
          {noPercentage > 0 && (
            <motion.div
              className="h-full bg-red-500"
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
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>Yes: {yesPercentage.toFixed(0)}%</span>
          <span>No: {noPercentage.toFixed(0)}%</span>
          <span>Not Voted: {notVotedPercentage.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}