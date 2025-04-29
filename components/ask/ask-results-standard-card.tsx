import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { VoteResult } from "@/lib/types";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  X,
  Twitter,
  Share2,
  Share,
} from "lucide-react";
import { useCleanText } from "@/hooks/useCleanText";
import validatorImageMapping from "@/utils/validatorImageMapping.json";
import Image from "next/image";
import { useState } from "react";
import DOMPurify from "dompurify";

interface AskResultsStandardCardProps {
  query: VoteResult;
  layoutMode: "grid" | "row";
  isOpen: boolean;
  toggleItem: (id: string) => void;
}

const SocialShareIcons = () => (
  <div className="flex justify-end mr-2 text-sm text-zinc-500 space-x-2 border-0">
    <Twitter className="h-4 w-4" />
    <Share2 className="h-4 w-4" />
    <Share className="h-4 w-4" />
  </div>
);

const getPercentage = (result: VoteResult) => {
  if (!result.isConsensusReached || !result.validatorResponses?.length) {
    return "N/A";
  }
  const totalVotes = result.validatorResponses.length;
  const matchingVotes = result.validatorResponses.filter(
    (response) => response.vote === (result.consensusValue ? "YES" : "NO")
  ).length;
  return `${((matchingVotes / totalVotes) * 100).toFixed(0)}%`;
};

const getColor = (result: VoteResult) =>
  result.consensusValue ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-700 dark:text-zinc-300";

const calculateRating = (result: VoteResult) => ({
  percentage: getPercentage(result),
  color: getColor(result),
});

export default function AskResultsStandardCard({
  query,
  layoutMode,
  isOpen,
  toggleItem,
}: AskResultsStandardCardProps) {
  // Sanitize query data to prevent XSS
  const sanitizedQuery = {
    ...query,
    queryText: DOMPurify.sanitize(query.queryText),
    validatorResponses: query.validatorResponses?.map((response) => ({
      ...response,
      profileName: DOMPurify.sanitize(response.profileName),
      provider: DOMPurify.sanitize(response.provider),
      id: DOMPurify.sanitize(response.id),
      rationale: DOMPurify.sanitize(response.rationale || ""),
    })),
  };

  const date = sanitizedQuery.timestamp ? new Date(sanitizedQuery.timestamp) : null;
  const formattedDate =
    date && !isNaN(date.getTime()) ? format(date, "PPPp") : "N/A";

  const { percentage, color } = calculateRating(sanitizedQuery);

  const matchingResponses =
    sanitizedQuery.validatorResponses?.filter(
      (response) =>
        sanitizedQuery.isConsensusReached &&
        ((sanitizedQuery.consensusValue && response.vote === "YES") ||
          (!sanitizedQuery.consensusValue && response.vote === "NO"))
    ) || [];
  const longestRationale = matchingResponses.length
    ? matchingResponses.reduce((longest, response) =>
        response.rationale.length > longest.rationale.length
          ? response
          : longest
      ).rationale
    : null;
  const { cleanText } = useCleanText(longestRationale);

  // Toggle state for rationale
  const [isRationaleExpanded, setIsRationaleExpanded] = useState(false);

  const toggleRationale = () => {
    setIsRationaleExpanded((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleRationale();
    }
  };

  return (
    <Card
      className={`
        bg-white dark:bg-zinc-800
        pt-4 gap-6
        border border-zinc-200 dark:border-zinc-700
        hover:border-zinc-400 active:border-zinc-400
        dark:hover:border-zinc-500 dark:active:border-zinc-500
        transition-colors
        ${layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-full lg:w-4xl"}
      `}
    >
      <div className="flex justify-between">
        <div className="flex justify-start mr-2 text-sm text-zinc-500 space-x-2 border-0"></div>
        <SocialShareIcons />
      </div>
      <CardHeader className="dark:bg-zinc-800">
        <CardTitle className="text-lg font-medium flex">
          <div>
            {sanitizedQuery.isConsensusReached && sanitizedQuery.consensusValue ? (
              <CircleCheck className="mr-2 h-7 w-7 text-green-700 dark:text-green-300" />
            ) : sanitizedQuery.isConsensusReached && !sanitizedQuery.consensusValue ? (
              <X className="mr-2 h-7 w-7 text-red-700 dark:text-red-300" />
            ) : null}
          </div>
          <div>{sanitizedQuery.queryText}</div>
        </CardTitle>
        <CardDescription className="font-light text-xs dark:text-zinc-500 text-zinc-500">
          {formattedDate}
        </CardDescription>
      </CardHeader>
      <hr className="h-1" />
      <CardContent className="space-y-2">
        <div className="my-1">
          <p className="text-4xl text-zinc-600 dark:text-zinc-300">
            {sanitizedQuery.isConsensusReached
              ? sanitizedQuery.consensusValue
                ? "Yes"
                : "No"
              : "No consensus"}
          </p>
        </div>
        <div>
          {longestRationale ? (
            <div
              role="button"
              tabIndex={0}
              onClick={toggleRationale}
              onKeyDown={handleKeyDown}
              className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md p-1"
              aria-expanded={isRationaleExpanded}
              aria-label={isRationaleExpanded ? "Collapse rationale" : "Expand rationale"}
            >
              <p
                className={`text-sm text-zinc-600 dark:text-zinc-300 leading-6 ${
                  isRationaleExpanded ? "" : "line-clamp-5"
                }`}
              >
                {cleanText}
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No matching rationale available.
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 border-0 mt-5 mb-5">
          <Image
            src="/Verafy-Logo@0.5x.png"
            alt="Verafy Logo"
            width={50}
            height={20}
            className="object-contain w-8 md:w-10"
          />
          <span className="text-sm font-light text-zinc-800 dark:text-zinc-200"> AI CONSENSUS:</span>
          <span
            className={`text-xl md:text-2xl font-normal ${color} border-0`}
            aria-label={`Consensus rating: ${percentage} ${sanitizedQuery.isConsensusReached ? (sanitizedQuery.consensusValue ? "YES" : "NO") : "N/A"}`}
          >
            {percentage}
          </span>
        </div>
        <div className="mt-3">
          {sanitizedQuery.validatorResponses?.length ? (
            <div className="flex flex-wrap gap-4 max-w-full">
              {sanitizedQuery.validatorResponses.map((response) => {
                const mapping = validatorImageMapping.find(
                  (m) => m.id === response.id
                );
                return (
                  <div
                    key={response.id}
                    className={`flex flex-col items-center justify-center max-w-[40px] overflow-wrap-anywhere`}
                  >
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                      {response.vote}
                    </p>
                    <div
                      className={`flex w-[40px] h-[40px] ${
                        response.vote === "YES"
                          ? "border border-green-500"
                          : "border border-red-500"
                      }`}
                    >
                      <Image
                        src={
                          mapping
                            ? `/icons/${mapping.imageName}`
                            : "/icons/placeholder.png"
                        }
                        alt={response.profileName}
                        width={40}
                        height={38}
                        className="grayscale object-contain"
                      />
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
      <CardFooter className="flex justify-start p-2">
        <Collapsible open={isOpen} onOpenChange={() => toggleItem(sanitizedQuery.id)}>
          <CollapsibleTrigger className="flex items-center text-sm font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer">
            Validator Responses ({sanitizedQuery.validatorResponses?.length ?? 0})
            {isOpen ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {sanitizedQuery.validatorResponses?.length ? (
              sanitizedQuery.validatorResponses.map((response) => (
                <div
                  key={response.id}
                  className="p-2 bg-zinc-100 dark:bg-zinc-700 rounded-md"
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="font-semibold">Provider: </span>
                    {response.provider}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="font-semibold">Profile: </span>
                    {response.profileName}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="font-semibold">Vote: </span>
                    {response.vote}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    <span className="font-semibold">Rationale: </span>
                    {response.rationale}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No validator responses available.
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardFooter>
    </Card>
  );
}