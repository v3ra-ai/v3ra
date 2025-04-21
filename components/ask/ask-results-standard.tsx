import { useVoteHistory } from "@/hooks/useVoteHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { VoteResult } from "@/lib/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorDisplay } from "@/components/error-display";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Grid3x3, Rows3 } from "lucide-react";
import { useState } from "react";

export default function AskResultsStandard() {
  const { voteHistory, isLoading, error, refetch } = useVoteHistory();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [layoutMode, setLayoutMode] = useState<"grid" | "row">("grid");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error.message || "Failed to load vote history"}
        onRetry={refetch}
      />
    );
  }

  const recentQueries = voteHistory.slice(-10).reverse(); // Last 10, newest first

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="container rounded-2xl shadow-md mx-auto px-4 py-8 max-w-6xl bg-transparent border-0 border-red-500 justify-center">
      <div className={`flex items-center justify-center mb-6 ${
              layoutMode === "row"
                ? "w-full border-0 border-red-500"
                : ""
            }`}>
        <h2 className="text-xl text-zinc-800 dark:text-zinc-200">
          Recent Queries
        </h2>
        <div className="flex space-x-2 ml-4">
          <Grid3x3
            className={`h-5 w-5 cursor-pointer ${
              layoutMode === "grid"
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
            onClick={() => setLayoutMode("grid")}
          />
          <Rows3
            className={`h-5 w-5 cursor-pointer ${
              layoutMode === "row"
                ? "text-zinc-900 dark:text-zinc-100"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
            onClick={() => setLayoutMode("row")}
          />
        </div>
      </div>
      {recentQueries.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          No recent queries found.
        </p>
      ) : (
        <div
          className={`max-w-6xl mx-auto ${
            layoutMode === "grid"
              ? "flex flex-wrap justify-center gap-4"
              : "flex flex-col gap-4 items-center justify-center"
          }`}
        >
          {recentQueries.map((query: VoteResult) => {
            // Safely parse timestamp
            const date = query.timestamp ? new Date(query.timestamp) : null;
            const formattedDate =
              date && !isNaN(date.getTime()) ? format(date, "PPPp") : "N/A";
            const isOpen = openItems[query.id] || false;

            return (
              <Card
                key={query.id}
                className={`bg-white dark:bg-zinc-800 ${
                  layoutMode === "grid" ? "w-full md:w-[22rem]" : "w-full lg:w-4xl"
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    {query.queryText}
                  </CardTitle>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Query ID: {query.id}
                  </p>
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
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      <span className="font-semibold">Date: </span>
                      {formattedDate}
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
                  <Collapsible
                    open={isOpen}
                    onOpenChange={() => toggleItem(query.id)}
                  >
                    <CollapsibleTrigger className="flex items-center text-sm font-semibold text-zinc-600 dark:text-zinc-300 cursor-pointer">
                      Validator Responses (
                      {query.validatorResponses?.length ?? 0})
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
