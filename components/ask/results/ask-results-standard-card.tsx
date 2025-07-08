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
import { AdaptivePhilosophicalDisplay } from "@/components/ask/results/adaptive-philosophical-display";
import { AdaptiveResultsDisplay } from "@/components/ask/results/adaptive-results-display";
import { QueryCategory } from "@/lib/types/query-classifier";

interface AskResultsStandardCardProps {
  query: VoteResult;
  layoutMode: "grid" | "row";
  isOpen: boolean;
  toggleItem: (id: string) => void;
  philosophyMode?: boolean;
}

export default function AskResultsStandardCard({
  query,
  layoutMode,
  isOpen,
  toggleItem,
  philosophyMode = false,
}: AskResultsStandardCardProps) {
  // Debug log to check incoming query data
  if (process.env.NODE_ENV === "development") {
    console.log("AskResultsStandardCard received query:", {
      query,
      hasValidatorResponses: !!query?.validatorResponses,
      responseCount: query?.validatorResponses?.length || 0,
      hasAdaptive: !!query?._adaptive,
    });
  }

  // Check if philosophy mode is enabled or if this is an adaptive philosophical response
  if (philosophyMode || query?._adaptive?.classification?.category === QueryCategory.IDENTITY_PHILOSOPHY) {
    return (
      <AdaptivePhilosophicalDisplay
        query={query.queryText}
        timestamp={query.timestamp?.toString() || new Date().toISOString()}
        responses={query.validatorResponses}
      />
    );
  }

  // Check if this is an adaptive response
  if (query?._adaptive) {
    
    // For fact-checking and other non-prediction queries, use the classic card style below
    // Only use adaptive display for predictions
    if (query._adaptive.classification.category === QueryCategory.PREDICTION) {
      return (
        <AdaptiveResultsDisplay
          response={{
            id: query.id,
            query: query.queryText,
            classification: query._adaptive.classification,
            consensus: query._adaptive.consensus,
            validatorResponses: query.validatorResponses,
            metadata: query._adaptive.metadata,
          }}
        />
      );
    }
    // Otherwise, fall through to use the classic dark card style
  }

  // Validate query data
  const isValidQuery = query && query.queryText && query.id;

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

  const { cleanText } = useCleanText();
  const cleanedRationale = cleanText(displayRationale);
  const formattedDate = sanitizedQuery.timestamp
    ? formatDateTimeCards(sanitizedQuery.timestamp)
    : "N/A";
  const yesVotes = sanitizedQuery.votingResult?.yes || 0;
  const noVotes = sanitizedQuery.votingResult?.no || 0;
  const percentageNum = calculateRating(yesVotes, noVotes);
  const percentage = `${percentageNum}%`;
  const color = percentageNum >= 50 ? "text-green-600" : "text-red-600";

  // Render fallback UI if query is invalid
  if (!isValidQuery) {
    return (
      <Card
        className={`
          bg-zinc-50 dark:bg-zinc-800
          pt-4 gap-2
          border border-zinc-200 dark:border-zinc-700
          transition-colors
          ${layoutMode === "grid" ? "w-full sm:w-[20rem] lg:w-[22rem]" : "w-full sm:w-[90%] md:w-[85%] lg:w-5xl max-w-5xl"}
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
        ${layoutMode === "grid" ? "w-full sm:w-[20rem] lg:w-[22rem]" : "w-full sm:w-[90%] lg:w-4xl"}
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
          cleanText={cleanedRationale}
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