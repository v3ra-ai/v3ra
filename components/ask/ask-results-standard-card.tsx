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
import { ChevronDown, ChevronUp, CircleCheck, X } from "lucide-react";

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

  return (
    <Card
      className={`bg-white dark:bg-zinc-800 ${
        layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-full lg:w-4xl"
      }`}
    >
      <CardHeader className="dark:bg-zinc-800">
        <CardTitle className="text-lg font-medium flex items-center">
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
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            <span className="font-semibold">Result: </span>
            {query.isConsensusReached
              ? query.consensusValue
                ? "Yes"
                : "No"
              : "No consensus"}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            Vote Summary:
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Yes: {query.votingResult.yes}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            No: {query.votingResult.no}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Not Voted: {query.votingResult.notVoted}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Collapsible
          open={isOpen}
          onOpenChange={() => toggleItem(query.id)}
        >
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