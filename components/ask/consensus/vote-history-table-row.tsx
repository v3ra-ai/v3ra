
import Link from "next/link";
import { Check, TrendingUpDown, WandSparkles, ShoppingCart } from "lucide-react";
import type { VoteResult } from "@/lib/types";
import DOMPurify from "dompurify";

interface VoteHistoryTableRowProps {
  vote: VoteResult;
  index: number;
  queryMode: string;
  expandedVoteId: number | null;
  handleViewClick: (index: number) => void;
}

const ValidatorResponseItem = ({ validator }: { validator: VoteResult["validatorResponses"][number] }) => (
  <div className="p-2 rounded border border-zinc-200 dark:border-zinc-700">
    <div className="flex justify-between items-center">
      <span className="font-medium text-sm text-gray-700 dark:text-zinc-200 flex items-center">
        {DOMPurify.sanitize(validator.profileName)}
        <span className="text-gray-500 dark:text-gray-400 ml-1">({DOMPurify.sanitize(validator.provider)})</span>
      </span>
      <span
        className={`
          px-2 py-1
          rounded-full
          text-xs font-medium
          ${
            validator?.vote?.toLowerCase() === "yes"
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }
        `}
      >
        {validator?.vote || "No Vote"}
      </span>
    </div>
    <div className="mt-2 text-sm text-gray-700 dark:text-zinc-200">
      {DOMPurify.sanitize(validator?.rationale || "No rationale provided")}
    </div>
  </div>
);

const formatTime = (timestamp: string | number | undefined) => {
  if (!timestamp) return "N/A";
  const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleTimeString();
};

export default function VoteHistoryTableRow({
  vote,
  index,
  queryMode,
  expandedVoteId,
  handleViewClick,
}: VoteHistoryTableRowProps) {
  // Sanitize vote data to prevent XSS
  const sanitizedVote = {
    ...vote,
    queryText: DOMPurify.sanitize(vote.queryText),
    validatorResponses: vote.validatorResponses?.map((response) => ({
      ...response,
      profileName: DOMPurify.sanitize(response.profileName),
      provider: DOMPurify.sanitize(response.provider),
      id: DOMPurify.sanitize(response.id),
      rationale: DOMPurify.sanitize(response.rationale || ""),
    })),
  };

  let consensusText = "Tie";
  if (sanitizedVote.isConsensusReached) {
    if (sanitizedVote.consensusValue === true) {
      consensusText = "Yes";
    } else if (sanitizedVote.consensusValue === false) {
      consensusText = "No";
    }
  }

  const modeIcon = {
    factCheck: <Check size={16} className="text-gray-900 dark:text-zinc-200" />,
    predict: <TrendingUpDown size={16} className="text-gray-900 dark:text-zinc-200" />,
    create: <WandSparkles size={16} className="text-gray-900 dark:text-zinc-200" />,
    shop: <ShoppingCart size={16} className="text-gray-900 dark:text-zinc-200" />,
  }[queryMode] || null;

  const rows = [];

  rows.push(
    <tr
      key={`vote-row-${index}`}
      className={index % 2 === 0 ? "bg-zinc-50 dark:bg-zinc-800" : ""}
    >
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200">
        {formatTime(sanitizedVote.timestamp)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200 max-w-[200px]">
        <span
          className={`cursor-pointer inline-block max-w-full ${
            expandedVoteId === index ? "whitespace-normal" : "truncate"
          }`}
          onClick={() => handleViewClick(index)}
          title={sanitizedVote.queryText.length > 45 ? `${sanitizedVote.queryText.substring(0, 45)}...` : sanitizedVote.queryText}
        >
          {sanitizedVote.queryText}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200">
        {modeIcon}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200">
        {sanitizedVote?.votingResult?.yes || 0}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-zinc-200">
        {sanitizedVote?.votingResult?.no || 0}
      </td>
      <td className="px-4 py-3 text-sm">
        <span
          className={`
            px-2 py-1
            rounded-full
            text-xs font-medium
            ${
              consensusText === "Yes"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : consensusText === "No"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            }
          `}
        >
          {consensusText}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <button
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
          onClick={() => handleViewClick(index)}
        >
          {expandedVoteId === index ? "Hide" : "View"}
        </button>
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/vote-sessions/${sanitizedVote.id}`}
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Discuss
        </Link>
      </td>
    </tr>
  );

  if (expandedVoteId === index) {
    rows.push(
      <tr key={`vote-details-${index}`}>
        <td colSpan={8} className="px-4 py-4 bg-zinc-100 dark:bg-zinc-800">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                Query:
              </h3>
              <p className="text-sm text-gray-700 dark:text-zinc-200">
                {sanitizedVote.queryText}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                Validator Responses:
              </h3>
              <div className="grid gap-2">
                {sanitizedVote.validatorResponses?.map((validator, idx) => (
                  <ValidatorResponseItem key={`validator-${index}-${idx}`} validator={validator} />
                ))}
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return rows;
}