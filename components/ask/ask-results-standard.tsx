"use client";

import { useVoteHistory } from "@/hooks/useVoteHistory";
import { useVoteStore } from "@/store/vote-store";
import { ErrorDisplay } from "@/components/error-display";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { Grid3x3, Rows3 } from "lucide-react";
import { useState, useEffect } from "react";
import { VoteResult } from "@/lib/types";
import AskResultsStandardCard from "@/components/ask/ask-results-standard-card";
import DOMPurify from "dompurify";
import { Skeleton } from "@/components/ui/skeleton";
import { RESULT_QUERIES_CARDS } from "@/lib/constants";

// Custom CSS for skeleton loading animation (pulse + shimmer)
<style jsx>{`
  @keyframes shimmer {
    0% {
      background-position: -468px 0;
    }
    100% {
      background-position: 468px 0;
    }
  }
  .skeleton-loading {
    background: linear-gradient(to right, #e2e8f0 0%, #f1f5f9 20%, #e2e8f0 40%, #e2e8f0 100%);
    background-size: 800px 104px;
    animation: shimmer 1.5s infinite linear;
  }
  .dark .skeleton-loading {
    background: linear-gradient(to right, #27272a 0%, #3f3f46 20%, #27272a 40%, #27272a 100%);
  }
`}</style>

const LayoutToggle = ({
  layoutMode,
  setLayoutMode,
}: {
  layoutMode: "grid" | "row";
  setLayoutMode: (mode: "grid" | "row") => void;
}) => (
  <div className="flex space-x-2 ml-4 invisible lg:visible">
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
    .slice(0, RESULT_QUERIES_CARDS);

// Skeleton card component styled like AskResultsStandardCard with loading animation
const SkeletonCard = ({ layoutMode }: { layoutMode: "grid" | "row" }) => {
  // Debug log to confirm rendering
  if (process.env.NODE_ENV === "development") {
    console.log("Rendering SkeletonCard with layoutMode:", layoutMode);
  }

  return (
    <div
      className={`
        bg-white dark:bg-zinc-800
        pt-4 gap-2
        border border-zinc-200 dark:border-zinc-700
        transition-colors
        ${layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-full lg:w-4xl"}
      `}
    >
      <div className="flex px-2 font-light text-xs dark:text-zinc-500 text-zinc-500">
        <div className="w-1/2">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="w-1/2 flex justify-end">
          <div className="flex space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
      </div>
      <hr className="h-1" />
      <div className="p-4">
        <div className="flex w-full justify-center items-center space-x-2">

          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="flex mt-4">
          <Skeleton className="h-10 w-24" />
          <div className="w-full justify-center text-zinc-300 dark:text-zinc-600">Loading...</div>
        </div>
        <div className="mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 mt-1" />
          <Skeleton className="h-4 w-4/5 mt-1" />
        </div>
        <div className="flex items-center space-x-2 mt-5 mb-5">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <Skeleton className="h-4 w-12 mb-1" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <hr className="h-1" />
      <div className="p-2">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
};

export default function AskResultsStandard() {
  const { voteHistory, isLoading, error, refetch } = useVoteHistory();
  const { lastVoteResult } = useVoteStore();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [layoutMode, setLayoutMode] = useState<"grid" | "row">("grid");

  // Debug log to confirm loading state
  if (process.env.NODE_ENV === "development") {
    console.log("AskResultsStandard isLoading:", isLoading);
  }

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
        {isLoading ? (
          <LoadingSpinner type="beat" message="Loading Recent Queries..." />
        ) : (
          <h2 className="text-md text-zinc-800 dark:text-zinc-200 font-light">
            Recent Queries
          </h2>
        )}
        <LayoutToggle layoutMode={layoutMode} setLayoutMode={setLayoutMode} />
      </div>
      {isLoading ? (
        <div
          className={`max-w-6xl mx-auto ${
            layoutMode === "grid"
              ? "flex flex-wrap justify-center gap-4"
              : "flex flex-col gap-4 items-center justify-center"
          }`}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} layoutMode={layoutMode} />
          ))}
        </div>
      ) : recentQueries.length === 0 ? (
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