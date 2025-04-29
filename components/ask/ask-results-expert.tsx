
import { createContext } from "react";
import { useVoteResult } from "@/hooks/useVoteResult";
import { VoteResult } from "@/lib/types";
import CurrentQuery from "@/components/ask/consensus/current-query";
import NetworkStatus from "@/components/ask/consensus/network-status";
import NetworkVisualization from "@/components/ask/consensus/network-visualization";
import Staking from "@/components/ask/consensus/staking";
import ValidatorResults from "@/components/ask/consensus/validator-results";
import ValidatorVoteHistory from "@/components/ask/consensus/vote-history";
import DOMPurify from "dompurify";

export const VoteResultContext = createContext<VoteResult | null>(null);

export default function AskResultsExpert() {
  const { voteResult } = useVoteResult();

  // Sanitize voteResult to prevent XSS
  const sanitizedVoteResult = voteResult
    ? {
        ...voteResult,
        queryText: DOMPurify.sanitize(voteResult.queryText),
        validatorResponses: voteResult.validatorResponses?.map((response) => ({
          ...response,
          profileName: DOMPurify.sanitize(response.profileName),
          provider: DOMPurify.sanitize(response.provider),
          id: DOMPurify.sanitize(response.id),
          rationale: DOMPurify.sanitize(response.rationale || ""),
        })),
      }
    : null;

  return (
    <VoteResultContext.Provider value={sanitizedVoteResult}>
      <div
        className={`
          container
          rounded-2xl shadow-md
          mx-auto px-4 py-8
          max-w-7xl
        `}
      >
        <h2 className="text-xl text-gray-800 dark:text-zinc-200 mb-6">Expert Query Results</h2>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Network and Query Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NetworkVisualization />
            <CurrentQuery />
          </div>
          {/* Network Status Row */}
          <div>
            <NetworkStatus />
          </div>
          <div>
            <ValidatorResults />
          </div>
          <div>
            <ValidatorVoteHistory />
          </div>
          <div>
            <Staking />
          </div>
        </div>
      </div>
    </VoteResultContext.Provider>
  );
}