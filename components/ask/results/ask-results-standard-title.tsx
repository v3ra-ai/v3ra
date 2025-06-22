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
      <CardHeader className="bg-transparent hover:bg-zinc-800/20 dark:hover:bg-zinc-800/10 transition-colors rounded-lg">
        <CardDescription className="flex font-light text-xs dark:text-zinc-500 text-zinc-500"></CardDescription>
        <CardTitle className="text-xl font-medium flex items-center text-zinc-100 dark:text-zinc-50">
          <div className="">
            {sanitizedQuery.isConsensusReached &&
            sanitizedQuery.consensusValue ? (
              <CircleCheck className="mr-2 h-7 w-7 text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
            ) : sanitizedQuery.isConsensusReached &&
              !sanitizedQuery.consensusValue ? (
              <X className="mr-2 h-7 w-7 text-rose-500 dark:text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.4)]" />
            ) : null}
          </div>

          {sanitizedQuery.queryText}
        </CardTitle>
      </CardHeader>
    </Link>
  );
}
