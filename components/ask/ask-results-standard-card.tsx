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

import { AskResultsStandardFooter } from "./ask-results-standard-footer";
import { AskResultsStandardValidatorAvatars } from "./ask-results-standard-validator-avatars";

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
  // Sanitize query data to prevent XSS
  const sanitizedQuery = {
    ...query,
    queryText: sanitizeQueryText(query.queryText),
    validatorResponses: query.validatorResponses?.map(
      sanitizeValidatorResponse
    ),
  };

  // Handle undefined timestamp with a fallback
  const formattedDate = sanitizedQuery.timestamp
    ? formatDateTimeCards(sanitizedQuery.timestamp)
    : "N/A";

  const { percentage, color } = calculateRating(sanitizedQuery);

  const matchingResponses =
    sanitizedQuery.validatorResponses?.filter(
      (response) =>
        sanitizedQuery.isConsensusReached &&
        ((sanitizedQuery.consensusValue && response.vote === "YES") ||
          (!sanitizedQuery.consensusValue && response.vote === "NO"))
    ) || [];

  // Store the entire response object for the longest rationale
  const longestRationaleResponse = matchingResponses.length
    ? matchingResponses.reduce((longest, response) =>
        response.rationale.length > longest.rationale.length
          ? response
          : longest
      )
    : null;

  const longestRationale = longestRationaleResponse?.rationale || null;
  const validatorName =
    longestRationaleResponse?.profileName || "Unknown Validator";
  const validatorProvider =
    longestRationaleResponse?.provider || "Unknown Provider";

  const { cleanText } = useCleanText(longestRationale);

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
      <AskResultsStandardHeader formattedDate={formattedDate} />
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
        <AskResultsStandardValidatorAvatars sanitizedQuery={sanitizedQuery}/>
        </div>
      </CardContent>
      <hr className="h-1 mt-2" />
      <AskResultsStandardFooter
        sanitizedQuery={sanitizedQuery}
        isOpen={isOpen}
        toggleItem={toggleItem}
      />
    </Card>
  );
}
