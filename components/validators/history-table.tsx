import { VoteResult } from "@/lib/types";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { parseRationale } from "@/lib/utils";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  MAX_VOTE_HISTORY_RESULTS,
  RECENT_HISTORY_RESULTS,
} from "@/lib/constants";

interface HistoryTableProps {
  isLoading: boolean;
  filteredHistory: VoteResult[];
  isRecentActive: boolean;
  voteFilter: "YES" | "NO" | null;
}

export default function HistoryTable({
  isLoading,
  filteredHistory,
  isRecentActive,
  voteFilter,
}: HistoryTableProps) {
  if (isLoading) {
    return <LoadingSpinner type="beat" message="Loading vote history..." />;
  }

  return filteredHistory.length > 0 ? (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300">
        <thead className="text-xs uppercase bg-zinc-100 dark:bg-zinc-700">
          <tr>
            <th className="px-4 py-2 w-8"></th>
            <th className="px-4 py-2">Query Text</th>
            <th className="px-4 py-2">Vote</th>
            <th className="px-4 py-2">Rationale</th>
            <th className="px-4 py-2">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {filteredHistory.map((vote, index) => {
            if (process.env.NODE_ENV === "development") {
              console.log(`Rendering vote ${index}:`, {
                voteId: vote.id,
                queryText: vote.queryText,
                response: vote.validatorResponses,
                timestamp: vote.timestamp,
              });
            }
            const response = vote.validatorResponses[0];
            return (
              <tr
                key={vote.id}
                className="border-b dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/ask/${vote.id}`}
                    className="block w-full h-full flex items-center"
                    aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                  >
                    <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/ask/${vote.id}`}
                    className="block w-full h-full"
                    aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                  >
                    {vote.queryText}
                  </Link>
                </td>
                <td
                  className={`px-4 py-2 ${response.vote === "NO" ? "text-red-600 dark:text-red-400" : "text-teal-600 dark:text-teal-400"}`}
                >
                  <Link
                    href={`/ask/${vote.id}`}
                    className="block w-full h-full"
                    aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                  >
                    {response.vote}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/ask/${vote.id}`}
                    className="block w-full h-full"
                    aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                  >
                    {parseRationale(response.rationale)}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/ask/${vote.id}`}
                    className="block w-full h-full"
                    aria-label={`View details for query: ${vote.queryText || "Untitled query"}`}
                  >
                    {vote.timestamp
                      ? new Date(vote.timestamp).toLocaleString()
                      : "N/A"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
        {isRecentActive
          ? `Showing the most recent ${RECENT_HISTORY_RESULTS} results.`
          : `This is currently capped at ${MAX_VOTE_HISTORY_RESULTS} results.`}
      </p>
    </div>
  ) : (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      {voteFilter
        ? `No ${voteFilter} votes found for this validator.`
        : "No vote history available for this validator."}
    </p>
  );
}