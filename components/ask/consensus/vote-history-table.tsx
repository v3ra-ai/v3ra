import VoteHistoryTableRow from "@/components/ask/consensus/vote-history-table-row";
import type { VoteResult } from "@/lib/types";
import DOMPurify from "dompurify";
import { parseRationale } from "@/lib/utils";

interface VoteHistoryTableProps {
  voteHistory: VoteResult[];
  expandedVoteId: number | null;
  handleViewClick: (index: number) => void;
  queryMode: string;
}

const columnConfig = {
  time: { width: "", label: "Time" },
  query: { width: "", label: "Query" },
  mode: { width: "w-[60px]", label: "Mode" },
  yes: { width: "w-[80px]", label: "Yes" },
  no: { width: "w-[80px]", label: "No" },
  consensus: { width: "", label: "Consensus" },
  details: { width: "", label: "Details" },
  discussion: { width: "", label: "Discussion" },
};

export default function VoteHistoryTable({
  voteHistory,
  expandedVoteId,
  handleViewClick,
  queryMode,
}: VoteHistoryTableProps) {
  // Sanitize voteHistory to prevent XSS
  const sanitizedVoteHistory = voteHistory.map((vote) => ({
    ...vote,
    queryText: DOMPurify.sanitize(vote.queryText),
    id: DOMPurify.sanitize(vote.id),
    validatorResponses: vote.validatorResponses?.map((response) => ({
      ...response,
      profileName: DOMPurify.sanitize(response.profileName),
      provider: DOMPurify.sanitize(response.provider),
      id: DOMPurify.sanitize(response.id),
      rationale: DOMPurify.sanitize(parseRationale(response.rationale) || ""),
    })),
  }));

  // Table displaying vote history with expandable rows
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
        <thead className="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            {Object.values(columnConfig).map(({ width, label }) => (
              <th
                key={label}
                scope="col"
                className={`
                  px-4 py-3
                  text-left
                  text-xs font-medium
                  text-gray-500 dark:text-gray-400
                  uppercase tracking-wider
                  ${width}
                `}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {sanitizedVoteHistory.flatMap((vote, index) => (
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