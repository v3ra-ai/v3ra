import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { VoteResult } from "@/lib/types";
import { parseRationale } from "@/lib/utils";

interface AskResultsStandardFooterProps {
  sanitizedQuery: VoteResult;
  isOpen: boolean;
  toggleItem: (id: string) => void;
}

export function AskResultsStandardFooter({
  sanitizedQuery,
  isOpen,
  toggleItem,
}: AskResultsStandardFooterProps) {
  return (
    <>
      <hr className="h-1 mt-2" />
      <div className="flex justify-start px-1">
        <Collapsible open={isOpen} onOpenChange={() => toggleItem(sanitizedQuery.id)}>
          <CollapsibleTrigger className="flex px-4 items-center text-sm font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer">
            <span className=""></span>Validator Responses ({sanitizedQuery.validatorResponses?.length ?? 0})
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
                    {parseRationale(response.rationale)}
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
      </div>
    </>
  );
}