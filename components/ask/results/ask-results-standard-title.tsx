import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck, X } from "lucide-react";
import { VoteResult } from "@/lib/types";

interface AskResultsStandardTitleProps {
  sanitizedQuery: VoteResult;
}

export function AskResultsStandardTitle({
  sanitizedQuery,
}: AskResultsStandardTitleProps) {
  return (
<CardHeader className="dark:bg-zinc-800">
<CardDescription className="flex font-light text-xs dark:text-zinc-500 text-zinc-500"></CardDescription>      <CardTitle className="text-lg font-medium flex">
        <div className="">
          {sanitizedQuery.isConsensusReached &&
          sanitizedQuery.consensusValue ? (
            <CircleCheck className="mr-2 h-7 w-7 text-green-700 dark:text-green-300" />
          ) : sanitizedQuery.isConsensusReached &&
            !sanitizedQuery.consensusValue ? (
            <X className="mr-2 h-7 w-7 text-red-700 dark:text-red-300" />
          ) : null}
        </div>
        <div>{sanitizedQuery.queryText}</div>
      </CardTitle>
    </CardHeader>
  );
}
