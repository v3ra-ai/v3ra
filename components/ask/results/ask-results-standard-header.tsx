import { AskResultsStandardSocialIcons } from "@/components/ask/results/ask-results-standard-social-icons";
import { VoteResult } from "@/lib/types";

interface AskResultsStandardHeaderProps {
  formattedDate: string;
  sanitizedQuery: VoteResult;
}

export function AskResultsStandardHeader({
  formattedDate,
  sanitizedQuery,
}: AskResultsStandardHeaderProps) {
  return (
    <div className="flex items-center font-light text-xs dark:text-zinc-500 text-zinc-500">
      <div className="w-1/2 items-center">{formattedDate}</div>
      <div className="w-1/2 justify-end">
        <div className="flex justify-between">
          <div className="flex justify-start text-sm text-zinc-500 space-x-2 border-0"></div>
          <AskResultsStandardSocialIcons query={sanitizedQuery} />
        </div>
      </div>
    </div>
  );
}
