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
  const date = query.timestamp ? new Date(query.timestamp) : null;
  const formattedDate =
    date && !isNaN(date.getTime()) ? format(date, "PPPp") : "N/A";

  console.log(query);

  const matchingResponses =
    query.validatorResponses?.filter(
      (response) =>
        query.isConsensusReached &&
        ((query.consensusValue && response.vote === "YES") ||
          (!query.consensusValue && response.vote === "NO"))
    ) || [];
  const longestRationale = matchingResponses.length
    ? matchingResponses.reduce((longest, response) =>
        response.rationale.length > longest.rationale.length
          ? response
          : longest
      ).rationale
    : null;
  const { cleanText } = useCleanText(longestRationale);

  return (
    <Card
      className={`bg-white dark:bg-zinc-800 pt-1 gap-6 ${
        layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-full lg:w-4xl"
      }`}
    >
      <div className="flex justify-end mr-2 text-sm text-zinc-500 space-x-2">
        <Twitter className="h-4 w-4" />
        <Share2 className="h-4 w-4" />
        <Share className="h-4 w-4" />
        {/* <Activity className="h-4 w-4" /> */}
      </div>
      <CardHeader className="dark:bg-zinc-800">
        <CardTitle className="text-lg font-medium flex">
          <div>
            {query.isConsensusReached && query.consensusValue ? (
              <CircleCheck className="mr-2 h-7 w-7 text-green-500" />
            ) : query.isConsensusReached && !query.consensusValue ? (
              <X className="mr-2 h-7 w-7 text-red-500" />
            ) : null}
          </div>
          <div>{query.queryText}</div>
        </CardTitle>
        <CardDescription className="font-light text-xs dark:text-zinc-500 text-zinc-500">
          {formattedDate}
        </CardDescription>
      </CardHeader>
      <hr className="h-1" />
      <CardContent className="space-b-2">
        <div className="my-1">
          <p className="text-4xl text-zinc-600 dark:text-zinc-300">
            {query.isConsensusReached
              ? query.consensusValue
                ? "Yes"
                : "No"
              : "No consensus"}
          </p>
        </div>
        <div>
          {longestRationale ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-5 leading-6">
              {cleanText}
            </p>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No matching rationale available.
            </p>
          )}
        </div>
        <div className="mt-3">
          {query.validatorResponses?.length ? (
            <div className="flex flex-wrap gap-4 max-w-full">
              {query.validatorResponses.map((response) => {
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
                          ? "border-2 border-green-500"
                          : "border-2 border-red-500"
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
      <CardFooter className="flex justify-startp-2">
        <Collapsible open={isOpen} onOpenChange={() => toggleItem(query.id)}>
          <CollapsibleTrigger className="flex items-center text-sm font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer">
            Validator Responses ({query.validatorResponses?.length ?? 0})
            {isOpen ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {query.validatorResponses?.length ? (
              query.validatorResponses.map((response) => (
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
