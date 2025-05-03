import { useVoteHistory } from "@/hooks/useVoteHistory";
import { useVoteStore } from "@/store/vote-store";
import { ErrorDisplay } from "@/components/error-display";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { Grid3x3, Rows3 } from "lucide-react";
import { useState, useEffect } from "react";
import { VoteResult } from "@/lib/types";
import AskResultsStandardCard from "@/components/ask/ask-results-standard-card";
import DOMPurify from "dompurify";

const LayoutToggle = ({
  layoutMode,
  setLayoutMode,
}: {
  layoutMode: "grid" | "row";
  setLayoutMode: (mode: "grid" | "row") => void;
}) => (
  <div className="flex space-x-2 ml-4">
    <Grid3x3
      className={`h-5 w-5 cursor-pointer ${layoutMode === "grid" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}
      onClick={() => setLayoutMode("grid")}
    />
    <Rows3
      className={`h-5 w-5 cursor-pointer ${layoutMode === "row" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400"}`}
      onClick={() => setLayoutMode("row")}
    />
  </div>
);

const getRecentQueries = (voteHistory: VoteResult[]) =>
  [...voteHistory]
    .sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10);

export default function AskResultsStandard() {
  const { voteHistory, isLoading, error, refetch } = useVoteHistory();
  const { lastVoteResult } = useVoteStore();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [layoutMode, setLayoutMode] = useState<"grid" | "row">("grid");

  // Sanitize voteHistory to prevent XSS
  const sanitizedVoteHistory = voteHistory.map((vote) => ({
    ...vote,
    queryText: DOMPurify.sanitize(vote.queryText),
    validatorResponses: vote.validatorResponses?.map((response) => ({
      ...response,
      profileName: DOMPurify.sanitize(response.profileName),
      provider: DOMPurify.sanitize(response.provider),
      id: DOMPurify.sanitize(response.id),
      rationale: DOMPurify.sanitize(response.rationale || ""),
    })),
  }));

  // Refetch vote history when lastVoteResult changes
  useEffect(() => {
    if (lastVoteResult?.id) {
      refetch();
    }
  }, [lastVoteResult?.id, refetch]);

  if (isLoading) {
    return <LoadingSpinner type="beat" message="Loading Recent Queries..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={DOMPurify.sanitize(
          error.message || "Failed to load vote history"
        )}
        onRetry={refetch}
      />
    );
  }

  const recentQueries = getRecentQueries(sanitizedVoteHistory);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      className={`
        container
        rounded-2xl shadow-md
        mx-auto px-4 py-4
        max-w-6xl
        bg-transparent
        border-0 border-red-500
        justify-center
      `}
      aria-live="polite"
    >
      <div
        className={`flex items-center mb-2 justify-center mb-3 ${layoutMode === "row" ? "w-full border-0 border-red-500" : ""}`}
      >
        <h2 className="text-md text-zinc-800 dark:text-zinc-200 font-light uppercase">
          Recent Queries
        </h2>
        <LayoutToggle layoutMode={layoutMode} setLayoutMode={setLayoutMode} />
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