import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { VoteResult } from "@/lib/types";
import { parseRationale } from "@/lib/utils";
import { ResultsCardFeedback } from "./results-card-feedback"; // Confirm import

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
      <div className="ml-5">
        <ResultsCardFeedback
          queryId={sanitizedQuery.id}
          component="ResultsCard"
        />
      </div>
      <hr className="h-1 mt-2" />
      <div className="flex justify-start px-1">
        <div className="w-full">
          <Collapsible
            open={isOpen}
            onOpenChange={() => toggleItem(sanitizedQuery.id)}
          >
            <CollapsibleTrigger className="flex px-4 items-center text-sm font-semibold text-zinc-300 dark:text-zinc-200 cursor-pointer hover:text-cyan-400 transition-colors">
              <span className="">
                A.I. Responses (
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
                    className="mx-4 p-4 bg-gradient-to-br from-zinc-900/60 via-black/60 to-zinc-950/60 backdrop-blur-sm rounded-lg border border-zinc-700/40 hover:border-cyan-500/30 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-cyan-400/80 font-medium">Provider:</span>{" "}
                          <span className="text-zinc-300">{response.provider}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-cyan-400/80 font-medium">Profile:</span>{" "}
                          <span className="text-zinc-100 font-semibold group-hover:text-cyan-300 transition-colors">
                            {response.profileName}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`
                          px-3 py-1 rounded-md text-sm font-bold
                          ${
                            response.vote === "YES"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : response.vote === "NO"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/50"
                          }
                        `}
                      >
                        {response.vote}
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-zinc-800/30 rounded-md border border-zinc-700/20">
                      <p className="text-sm text-cyan-400/80 font-medium mb-1">Rationale:</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {parseRationale(response.rationale)}
                      </p>
                    </div>
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
