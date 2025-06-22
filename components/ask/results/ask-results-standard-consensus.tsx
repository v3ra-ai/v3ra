import { VoteResult } from "@/lib/types";

interface AskResultsStandardConsensusProps {
  sanitizedQuery: VoteResult;
}

export function AskResultsStandardConsensus({ sanitizedQuery }: AskResultsStandardConsensusProps) {
  return (
    <div className="my-1">
      <p className={`text-4xl font-bold ${
        sanitizedQuery.isConsensusReached
          ? sanitizedQuery.consensusValue
            ? "text-emerald-400 dark:text-emerald-400 dark:drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]"
            : "text-rose-400 dark:text-rose-400 dark:drop-shadow-[0_0_10px_rgba(251,113,133,0.5)]"
          : "text-zinc-400 dark:text-zinc-500"
      }`}>
        {sanitizedQuery.isConsensusReached
          ? sanitizedQuery.consensusValue
            ? "Yes"
            : "No"
          : "No consensus"}
      </p>
    </div>
  );
}