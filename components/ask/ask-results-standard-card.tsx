import { Card, CardContent } from "@/components/ui/card";
import { VoteResult } from "@/lib/types";
import { useCleanText } from "@/hooks/useCleanText";
import validatorImageMapping from "@/utils/validatorImageMapping.json";
import Image from "next/image";
import Link from "next/link";
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
        bg-white dark:bg-zinc-800
        pt-4 gap-2
        border border-zinc-200 dark:border-zinc-700
        hover:border-zinc-400 active:border-zinc-400
        dark:hover:border-zinc-500 dark:active:border-zinc-500
        transition-colors
        ${layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-full lg:w-4xl"}
      `}
    >
      <AskResultsStandardHeader formattedDate={formattedDate} />
      <hr className="h-1" />
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
          {sanitizedQuery.validatorResponses?.length ? (
            <div className="flex flex-wrap gap-4 max-w-full">
              {sanitizedQuery.validatorResponses.map((response) => {
                const mapping = validatorImageMapping.find(
                  (m) => m.id === response.id
                ) as
                  | { id: string; profile: string; avatarUrl: string | null }
                  | undefined;
                // Enhanced debugging for validator data
                if (process.env.NODE_ENV === "development") {
                  // console.log(`Validator ID: ${response.id}`);
                  // console.log(`Mapping found: ${!!mapping}`);
                  if (mapping) {
                    // console.log(`Mapping data:`, mapping);
                  } else {
                    // console.log(`No mapping for ID ${response.id} in validatorImageMapping`);
                  }
                }
                return (
                  <div
                    key={response.id}
                    className={`flex flex-col items-center justify-center max-w-[40px] overflow-wrap-anywhere relative group`}
                  >
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                      {response.vote}
                    </p>
                    <Link href={`/validators/${response.id}/profile`}>
                      <div
                        className={`flex w-[40px] h-[40px] ${
                          response.vote === "YES"
                            ? "border border-green-500"
                            : "border border-red-500"
                        } cursor-pointer hover:opacity-80 transition-opacity`}
                      >
                        <Image
                          src={
                            mapping?.avatarUrl
                              ? `/icons/${mapping.avatarUrl}`
                              : "/icons/placeholder.png"
                          }
                          alt={response.profileName}
                          width={40}
                          height={38}
                          className="grayscale object-contain"
                        />
                      </div>
                    </Link>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-100 dark:bg-zinc-700 rounded-md shadow-lg text-sm text-zinc-600 dark:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <p>
                        <span className="font-semibold">Provider: </span>
                        {response.provider}
                      </p>
                      <p>
                        <span className="font-semibold">Profile: </span>
                        {response.profileName}
                      </p>
                      <p>
                        <span className="font-semibold">Vote: </span>
                        {response.vote}
                      </p>
                      <p>
                        <span className="font-semibold">Rationale: </span>
                        {response.rationale}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No validator responses available.
            </p>
          )}
        </div>
      </CardContent>
      <hr className="h-1 border" />
      <AskResultsStandardFooter
        sanitizedQuery={sanitizedQuery}
        isOpen={isOpen}
        toggleItem={toggleItem}
      />
    </Card>
  );
}
