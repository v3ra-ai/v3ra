import { useVoteResult } from "@/hooks/useVoteResult";
import NetworkVisualization from "@/components/ask/consensus/network-visualization";
import CurrentQuery from "@/components/ask/consensus/current-query";
import NetworkStatus from "@/components/ask/consensus/network-status";
import ValidatorResults from "@/components/ask/consensus/validator-results";
import Staking from "@/components/ask/consensus/staking";
import ValidatorVoteHistory from "@/components/ask/consensus/vote-history";

export default function AskResultsExpert() {
  const { voteResult } = useVoteResult();

  return (
    <div className="container rounded-2xl shadow-md mx-auto px-4 py-8 max-w-7xl">
      <h2 className="text-xl text-gray-800 dark:text-zinc-200 mb-6">
        Expert Query Results
      </h2>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* First row: Network Visualization and Current Query */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NetworkVisualization />
          <CurrentQuery voteResult={voteResult} />
        </div>

        {/* Second row: Network Status (full width) */}
        <div>
          <NetworkStatus />
        </div>

        {/* Third row: Validator Results (full width) */}
        <div>
          <ValidatorResults />
        </div>

        {/* Fourth row: Validator Vote History (full width) */}
        <div>
          <ValidatorVoteHistory />
        </div>

        {/* Fifth row: Staking (full width) */}
        <div>
          <Staking />
        </div>
      </div>
    </div>
  );
}