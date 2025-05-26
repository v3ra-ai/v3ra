import { Card, CardContent } from "@/components/ui/card";
import { VoteResult } from "@/lib/types";
import { useCleanText } from "@/hooks/useCleanText";
import {
  sanitizeQueryText,
  sanitizeValidatorResponse,
} from "@/utils/security-utils";
import { calculateRating } from "@/utils/vote-utils";
import { formatDateTimeCards } from "@/utils/date-utils";
import { AskResultsStandardHeader } from "@/components/ask/ask-results-standard-header";
import { AskResultsStandardTitle } from "@/components/ask/ask-results-standard-title";
import { AskResultsStandardConsensus } from "@/components/ask/ask-results-standard-consensus";
import { AskResultsStandardRationale } from "@/components/ask/ask-results-standard-rationale";
import { AskResultsStandardAiConsensus } from "@/components/ask/ask-results-standard-ai-consensus";
import { AskResultsStandardFooter } from "@/components/ask/ask-results-standard-footer";
import { AskResultsStandardValidatorAvatars } from "@/components/ask/ask-results-standard-validator-avatars";

interface AskResultsStandardCardProps {
  query: VoteResult;
  layoutMode: "grid" | "row";
  isOpen: boolean;
  toggleItem: (id: string) => void;
}

export default function AskResultsStandardCard({
  query,
  layoutMode,
  isOpen,
  toggleItem,
}: AskResultsStandardCardProps) {
  // Validate query data
  const isValidQuery = query && query.queryText && query.id;
  if (!isValidQuery) {
    console.error('Invalid query data in AskResultsStandardCard:', {
      query,
      id: query?.id,
      queryText: query?.queryText,
    });
  }

  // Sanitize query data to prevent XSS
  const sanitizedQuery: VoteResult = isValidQuery
    ? {
        ...query,
        queryText: sanitizeQueryText(query.queryText),
        validatorResponses: query.validatorResponses?.map(sanitizeValidatorResponse) || [],
        votingResult: query.votingResult || { yes: 0, no: 0, notVoted: 0 },
      }
    : {
        id: query?.id || 'unknown',
        queryText: 'Unknown Query',
        isConsensusReached: false,
        consensusValue: null,
        validatorResponses: [],
        votingResult: { yes: 0, no: 0, notVoted: 0 },
        timestamp: query?.timestamp,
      };

  // Compute matching responses and longest rationale
  const matchingResponses =
    sanitizedQuery.validatorResponses?.filter(
      (response) =>
        sanitizedQuery.isConsensusReached &&
        ((sanitizedQuery.consensusValue && response.vote === "YES") ||
          (!sanitizedQuery.consensusValue && response.vote === "NO"))
    ) || [];

  const longestRationaleResponse = matchingResponses.length
    ? matchingResponses.reduce((longest, response) =>
        response.rationale.length > longest.rationale.length ? response : longest
      )
    : null;

  const longestRationale = longestRationaleResponse?.rationale || null;

  // Call hook unconditionally with computed longestRationale
  const { cleanText } = useCleanText(longestRationale);

  // Handle undefined timestamp with a fallback
  const formattedDate = sanitizedQuery.timestamp
    ? formatDateTimeCards(sanitizedQuery.timestamp)
    : "N/A";

  const { percentage, color } = calculateRating(sanitizedQuery);

  const validatorName = longestRationaleResponse?.profileName || "Unknown Validator";
  const validatorProvider = longestRationaleResponse?.provider || "Unknown Provider";

  // Render fallback UI if query is invalid
  if (!isValidQuery) {
    return (
      <Card
        className={`
          bg-zinc-50 dark:bg-zinc-800
          pt-4 gap-2
          border border-zinc-200 dark:border-zinc-700
          transition-colors
          ${layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-full lg:w-4xl"}
        `}
      >
        <CardContent className="p-4">
          <p className="text-zinc-500">Unable to display query data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`
        bg-zinc-50 dark:bg-zinc-800
        pt-4 gap-2
        border border-zinc-200 dark:border-zinc-700
        hover:border-zinc-400 active:border-zinc-400
        dark:hover:border-zinc-500 dark:active:border-zinc-500
        transition-colors
        ${layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-full lg:w-4xl"}
      `}
    >
      <AskResultsStandardHeader formattedDate={formattedDate} sanitizedQuery={sanitizedQuery} />
      <hr className="h-1 mt-2" />
      <AskResultsStandardTitle sanitizedQuery={sanitizedQuery} />
      <hr className="h-1 mt-2" />
      <CardContent className="space-y-2">
        <AskResultsStandardConsensus sanitizedQuery={sanitizedQuery} />
        <AskResultsStandardRationale
          longestRationale={longestRationale}
          validatorName={validatorName}
          validatorProvider={validatorProvider}
          cleanText={cleanText}
        />
        <AskResultsStandardAiConsensus
          percentage={percentage}
          color={color}
          sanitizedQuery={sanitizedQuery}
        />
        <div className="mt-3">
          <AskResultsStandardValidatorAvatars sanitizedQuery={sanitizedQuery} />
        </div>

      </CardContent>
      <AskResultsStandardFooter
        sanitizedQuery={sanitizedQuery}
        isOpen={isOpen}
        toggleItem={toggleItem}
      />
    </Card>
  );
}