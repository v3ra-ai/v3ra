import { useVoteHistory } from "@/hooks/useVoteHistory";
import { useQueryStore } from "@/store/query-store";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorDisplay } from "@/components/error-display";
import { Grid3x3, Rows3 } from "lucide-react";
import { useState, useEffect } from "react";
import AskResultsStandardCard from "./ask-results-standard-card";

export default function AskResultsStandard() {
  const { voteHistory, isLoading, error, refetch } = useVoteHistory();
  const { lastVoteResult } = useQueryStore();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [layoutMode, setLayoutMode] = useState<"grid" | "row">("grid");

  // Refetch vote history when lastVoteResult changes
  useEffect(() => {
    if (lastVoteResult?.id) {
      refetch();
    }
  }, [lastVoteResult?.id, refetch]);

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

  const recentQueries = [...voteHistory]
    .sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA; // Newest first
    })
    .slice(0, 10);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      className="container rounded-2xl shadow-md mx-auto px-4 py-8 max-w-6xl bg-transparent border-0 border-red-500 justify-center"
      aria-live="polite"
    >
      <div
        className={`flex items-center justify-center mb-6 ${
          layoutMode === "row" ? "w-full border-0 border-red-500" : ""
        }`}
      >
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
          {recentQueries.map((query) => (
            <AskResultsStandardCard
              key={query.id}
              query={query}
              layoutMode={layoutMode}
              isOpen={openItems[query.id] || false}
              toggleItem={toggleItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}