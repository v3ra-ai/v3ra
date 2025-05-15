"use client";

import { createContext } from "react";
import { useVoteResult } from "@/hooks/useVoteResult";
import { useQueryStore } from "@/store/query-store";
import { VoteResult } from "@/lib/types";
import CurrentQuery from "@/components/ask/consensus/current-query";
import NetworkStatus from "@/components/ask/consensus/network-status";
import NetworkVisualization from "@/components/ask/charts/network-visualization";
import QueriesChart from "@/components/ask/charts/queries-chart";
import ValidatorResults from "@/components/ask/consensus/validator-results";
import ValidatorVoteHistory from "@/components/ask/consensus/vote-history";
import {
  sanitizeQueryText,
  sanitizeValidatorResponse,
} from "@/utils/security-utils";
import StakingAreaStacked from "./charts/staking-area-stacked";

export const VoteResultContext = createContext<VoteResult | null>(null);

export default function AskResultsExpert() {
  const { voteResult } = useVoteResult();
  const viewMode = useQueryStore((state) => state.viewMode);

  // Sanitize voteResult to prevent XSS
  const sanitizedVoteResult = voteResult
    ? {
        ...voteResult,
        queryText: sanitizeQueryText(voteResult.queryText),
        validatorResponses: voteResult.validatorResponses?.map(
          sanitizeValidatorResponse
        ),
      }
    : null;

  // Only render in expert mode
  if (viewMode !== "viewExpert") {
    console.log("[AskResultsExpert] Not rendering: viewMode is", viewMode);
    return null;
  }

  console.log("[AskResultsExpert] Rendering in expert mode with components including CurrentQuery");

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
        <h2 className="text-xl text-gray-800 dark:text-zinc-200 mb-6">
          Expert Query Results
        </h2>
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
            <StakingAreaStacked />
          </div>
          <div>
            <QueriesChart />
          </div>
        </div>
      </div>
    </VoteResultContext.Provider>
  );
}