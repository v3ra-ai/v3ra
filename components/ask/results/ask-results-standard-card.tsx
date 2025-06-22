import { VoteResult } from "@/lib/types";
import { useCleanText } from "@/hooks/useCleanText";
import {
  sanitizeQueryText,
  sanitizeValidatorResponse,
} from "@/utils/security-utils";
import { calculateRating } from "@/utils/vote-utils";
import { formatDateTimeCards } from "@/utils/date-utils";
import { AskResultsStandardHeader } from "@/components/ask/results/ask-results-standard-header";
import { AskResultsStandardTitle } from "@/components/ask/results/ask-results-standard-title";
import { AskResultsStandardConsensus } from "@/components/ask/results/ask-results-standard-consensus";
import { AskResultsStandardRationale } from "@/components/ask/results/ask-results-standard-rationale";
import { AskResultsStandardAiConsensus } from "@/components/ask/results/ask-results-standard-ai-consensus";
import { AskResultsStandardFooter } from "./ask-results-standard-footer";
import { AskResultsStandardValidatorAvatars } from "./ask-results-standard-validator-avatars";
import { parseRationaleDetailed } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

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
  // Debug log to check incoming query data
  if (process.env.NODE_ENV === "development") {
    console.log("AskResultsStandardCard received query:", {
      query,
      hasValidatorResponses: !!query?.validatorResponses,
      responseCount: query?.validatorResponses?.length || 0,
    });
  }

  // Validate query data
  const isValidQuery = query && query.queryText && query.id;
  if (!isValidQuery) {
    console.error("Invalid query data in AskResultsStandardCard:", {
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
        validatorResponses:
          query.validatorResponses?.map(sanitizeValidatorResponse) || [],
        votingResult: query.votingResult || { yes: 0, no: 0, notVoted: 0 },
      }
    : {
        id: query?.id || "unknown",
        queryText: "Unknown Query",
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

  const rawLongestRationale = longestRationaleResponse?.rationale || null;
  const displayRationale = parseRationaleDetailed(rawLongestRationale).rationale;
  const validatorName =
    longestRationaleResponse?.profileName || "Unknown Validator";
  const validatorProvider =
    longestRationaleResponse?.provider || "Unknown Provider";

  const { cleanText } = useCleanText(displayRationale);
  const formattedDate = sanitizedQuery.timestamp
    ? formatDateTimeCards(sanitizedQuery.timestamp)
    : "N/A";
  const { percentage, color } = calculateRating(sanitizedQuery);

  // Render fallback UI if query is invalid
  if (!isValidQuery) {
    return (
      <Card
        className={`
          bg-zinc-50 dark:bg-zinc-800
          pt-4 gap-2
          border border-zinc-200 dark:border-zinc-700
          transition-colors
          ${layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-[95%] sm:w-[90%] md:w-[85%] lg:w-5xl max-w-5xl"}
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
        bg-gradient-to-br from-zinc-900/90 via-zinc-900/95 to-black/90
        dark:from-zinc-900/50 dark:via-black/60 dark:to-zinc-950/70
        backdrop-blur-2xl
        pt-4 gap-2
        border border-zinc-700/50 dark:border-cyan-500/20
        hover:border-cyan-400/40 active:border-cyan-400/60
        dark:hover:border-cyan-400/40 dark:active:border-cyan-400/60
        transition-all duration-300 hover:-translate-y-1
        hover:shadow-2xl dark:hover:shadow-[0_0_40px_rgba(0,255,255,0.15)]
        dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]
        ${layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-full lg:w-4xl"}
      `}
    >
      <div className="px-4">
        <AskResultsStandardHeader
          formattedDate={formattedDate}
          sanitizedQuery={sanitizedQuery}
        />
      </div>
      <hr className="h-1 mt-2" />
      <AskResultsStandardTitle sanitizedQuery={sanitizedQuery} />
      <hr className="h-1 mt-2" />
      <CardContent className="space-y-2">
        <AskResultsStandardConsensus sanitizedQuery={sanitizedQuery} />
        <AskResultsStandardRationale
          longestRationale={displayRationale}
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