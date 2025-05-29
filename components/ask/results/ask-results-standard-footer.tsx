import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { VoteResult } from "@/lib/types";
import { parseRationale } from "@/lib/utils";
import { ResultsCardFeedback } from "./results-card-feedback"; // Add import

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

      <div className="mt-2 ml-6">
        <ResultsCardFeedback
          component="ResultsCard"
          action={sanitizedQuery.id}
        />
      </div>
      <hr className="h-1 mt-0" />
      <div className="flex justify-start px-1">
        <div className="w-full">
          <Collapsible
            open={isOpen}
            onOpenChange={() => toggleItem(sanitizedQuery.id)}
          >
            <CollapsibleTrigger className="flex px-0 items-center text-sm font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer">
              <span className="ml-5">
                Validator Responses (
                {sanitizedQuery.validatorResponses?.length ?? 0})
              </span>
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
      </div>
    </>
  );
}
