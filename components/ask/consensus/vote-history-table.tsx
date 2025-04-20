
import VoteHistoryTableRow from "./vote-history-table-row";
import type { VoteResult } from "@/lib/types";

interface VoteHistoryTableProps {
  voteHistory: VoteResult[];
  expandedVoteId: number | null;
  handleViewClick: (index: number) => void;
  queryMode: string; // Add queryMode prop
}

export default function VoteHistoryTable({
  voteHistory,
  expandedVoteId,
  handleViewClick,
  queryMode, // Include queryMode in destructured props
}: VoteHistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Time
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Query
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[60px]"
            >
              Mode
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[80px]"
            >
              Yes
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[80px]"
            >
              No
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Consensus
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Details
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Discussion
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {voteHistory.flatMap((vote, index) => (
            <VoteHistoryTableRow
              key={`vote-row-${index}`}
              vote={vote}
              index={index}
              queryMode={queryMode}
              expandedVoteId={expandedVoteId}
              handleViewClick={handleViewClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}