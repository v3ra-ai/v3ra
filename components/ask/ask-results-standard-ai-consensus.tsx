import Image from "next/image";
import { VoteResult } from "@/lib/types";

interface AskResultsStandardAiConsensusProps {
  percentage: string;
  color: string;
  sanitizedQuery: VoteResult;
}

export function AskResultsStandardAiConsensus({
  percentage,
  color,
  sanitizedQuery,
}: AskResultsStandardAiConsensusProps) {
  return (
    <div className="flex items-center space-x-2 border-0 mt-5 mb-5">
      <Image
        src="/Verafy-Logo@0.5x.png"
        alt="Verafy Logo"
        width={50}
        height={20}
        className="object-contain w-8 md:w-10"
      />
      <span className="text-sm font-light text-zinc-800 dark:text-zinc-200">AI CONSENSUS:</span>
      <span
        className={`text-xl md:text-2xl font-normal ${color} border-0`}
        aria-label={`Consensus rating: ${percentage} ${
          sanitizedQuery.isConsensusReached
            ? sanitizedQuery.consensusValue
              ? "YES"
              : "NO"
            : "N/A"
        }`}
      >
        {percentage}
      </span>
    </div>
  );
}