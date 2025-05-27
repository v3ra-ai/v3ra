import { VoteStats } from "@/lib/types";

interface VoteStatisticsProps {
  stats: VoteStats;
  isRecentActive: boolean;
  voteFilter: "YES" | "NO" | null;
  isYesActive: boolean;
  isNoActive: boolean;
  handleYesClick: () => void;
  handleNoClick: () => void;
}

export default function VoteStatistics({
  stats,
  isRecentActive,
  voteFilter,
  isYesActive,
  isNoActive,
  handleYesClick,
  handleNoClick,
}: VoteStatisticsProps) {
  return (
    <div className="flex flex-col space-y-4 py-4 border-y-2 border-0 justify-center items-center">
      <h2 className="text-lg text-center font-semibold text-zinc-800 dark:text-zinc-200">
        Vote Statistics {isRecentActive ? "(Recent)" : "(All)"}
        {voteFilter ? ` (Filtered: ${voteFilter})` : ""}
      </h2>
      <div className="flex flex-wrap text-center gap-8 w-[50%] md:w-full justify-center border-0">
        <div className="w-full sm:w-auto justify-center">
          <p className="text-2xl text-center font-semibold text-zinc-800 dark:text-zinc-200">
            {stats.totalVotes}
          </p>
          <h3 className="text-sm text-center text-zinc-600 dark:text-zinc-300">
            Total Votes
          </h3>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={handleYesClick}
            className="block w-full text-center cursor-pointer"
            aria-pressed={isYesActive}
            aria-label="Toggle filter for YES votes"
          >
            <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
              {stats.yesVotes}
            </p>
            <h3 className="text-sm text-zinc-600 dark:text-zinc-300 flex justify-center items-center gap-1">
              {isYesActive && (
                <span className="inline-block w-2 h-2 bg-teal-500"></span>
              )}
              YES Votes
            </h3>
          </button>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={handleNoClick}
            className="block w-full text-center cursor-pointer"
            aria-pressed={isNoActive}
            aria-label="Toggle filter for NO votes"
          >
            <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
              {stats.noVotes}
            </p>
            <h3 className="text-sm text-zinc-600 dark:text-zinc-400 flex justify-center items-center gap-1">
              {isNoActive && (
                <span className="inline-block w-2 h-2 bg-teal-500"></span>
              )}
              NO Votes
            </h3>
          </button>
        </div>
        <div className="w-full sm:w-auto">
          <p className="text-2xl text-center font-semibold text-zinc-800 dark:text-zinc-200">
            {Math.round(stats.consensusMatchPercentage)}%
          </p>
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Reliability
          </h3>
        </div>
        <div className="w-full sm:w-auto">
          <p className="text-2xl text-center font-semibold text-zinc-800 dark:text-zinc-200">
            {Math.round(stats.consensusMatchPercentage)}%
          </p>
          <h3 className="text-sm text-center font-medium text-zinc-600 dark:text-zinc-400">
            Consensus
          </h3>
        </div>
        <div className="w-full sm:w-auto">
          <p className="text-2xl text-center font-semibold text-zinc-800 dark:text-zinc-200">
            {Math.round(stats.nonConsensusPercentage)}%
          </p>
          <h3 className="text-sm text-center font-medium text-zinc-600 dark:text-zinc-400">
            Non-Consensus
          </h3>
        </div>
      </div>
    </div>
  );
}