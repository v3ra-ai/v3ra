import { VoteResult } from "@/lib/types";

interface AskResultsStandardConsensusProps {
  sanitizedQuery: VoteResult;
}

export function AskResultsStandardConsensus({ sanitizedQuery }: AskResultsStandardConsensusProps) {
  return (
    <div className="my-1">
      <p className="text-4xl text-zinc-600 dark:text-zinc-300">
        {sanitizedQuery.isConsensusReached
          ? sanitizedQuery.consensusValue
            ? "Yes"
            : "No"
          : "No consensus"}
      </p>
    </div>
  );
}