import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck, X } from "lucide-react";
import { VoteResult } from "@/lib/types";
import Link from "next/link";

interface AskResultsStandardTitleProps {
  sanitizedQuery: VoteResult;
}

export function AskResultsStandardTitle({
  sanitizedQuery,
}: AskResultsStandardTitleProps) {
  return (
    <Link
      href={`/ask/${sanitizedQuery.id}`}
      className="text-zinc-900 dark:text-zinc-100"
    >
      <CardHeader className="dark:bg-zinc-800">
        <CardDescription className="flex font-light text-xs dark:text-zinc-500 text-zinc-500"></CardDescription>
        <CardTitle className="text-xl font-medium flex">
          <div className="">
            {sanitizedQuery.isConsensusReached &&
            sanitizedQuery.consensusValue ? (
              <CircleCheck className="mr-2 h-7 w-7 text-green-700 dark:text-green-300" />
            ) : sanitizedQuery.isConsensusReached &&
              !sanitizedQuery.consensusValue ? (
              <X className="mr-2 h-7 w-7 text-red-700 dark:text-red-300" />
            ) : null}
          </div>

          {sanitizedQuery.queryText}
        </CardTitle>
      </CardHeader>
    </Link>
  );
}
