"use client";

import { useVoteHistory } from "@/hooks/useVoteHistory";
import { useVoteStore } from "@/store/vote-store";
import { ErrorDisplay } from "@/components/error-display";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { Grid3x3, AlignJustify, Star } from "lucide-react";
import { useState } from "react";
import AskResultsStandardCard from "@/components/ask/results/ask-results-standard-card";
import { default as DOMPurify } from "dompurify";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from "@/hooks/useFavorites";
import { PaginatedResultsContainer } from "./paginated-results-container";

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
    background: linear-gradient(
      to right,
      #e2e8f0 0%,
      #f1f5f9 20%,
      #e2e8f0 40%,
      #e2e8f0 100%
    );
    background-size: 800px 104px;
    animation: shimmer 1.5s infinite linear;
  }
  .dark .skeleton-loading {
    background: linear-gradient(
      to right,
      #27272a 0%,
      #3f3f46 20%,
      #27272a 40%,
      #27272a 100%
    );
  }
`}</style>;

const LayoutToggle = ({
  layoutMode,
  setLayoutMode,
  showFavoritesOnly,
  setShowFavoritesOnly,
}: {
  layoutMode: "grid" | "row";
  setLayoutMode: (mode: "grid" | "row") => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
}) => (
  <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 opacity-70 transition-opacity duration-200 hover:opacity-100">
    <button
      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
      className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
        showFavoritesOnly
          ? "bg-amber-500 text-white shadow-md"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
      aria-label={showFavoritesOnly ? "Show all queries" : "Show favorites only"}
      title={showFavoritesOnly ? "Showing favorites only" : "Show favorites only"}
    >
      <Star
        className={`h-4 w-4 transition-transform duration-200 cursor-pointer ${
          showFavoritesOnly ? "fill-current scale-110" : ""
        }`}
      />
    </button>
    {/* Virtual scroll toggle removed per user request */}
    <button
      onClick={() => setLayoutMode("grid")}
      className={`p-1.5 rounded-md transition-colors duration-200 cursor-pointer ${
        layoutMode === "grid"
          ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
      aria-label="Grid view"
    >
      <Grid3x3 className="h-4 w-4" />
    </button>
    <button
      onClick={() => setLayoutMode("row")}
      className={`p-1.5 rounded-md transition-colors duration-200 cursor-pointer ${
        layoutMode === "row"
          ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
      aria-label="Row view"
    >
      <AlignJustify className="h-4 w-4" />
    </button>
  </div>
);

// Skeleton card component styled like AskResultsStandardCard
const SkeletonCard = ({ layoutMode }: { layoutMode: "grid" | "row" }) => {
  if (process.env.NODE_ENV === "development") {
    console.log("Rendering SkeletonCard with layoutMode:", layoutMode);
  }

  return (
    <div
      className={`
        bg-zinc-200 dark:bg-zinc-900
        pt-4 gap-2
        border border-zinc-200 dark:border-zinc-700
        transition-colors
        ${layoutMode === "grid" ? "w-full lg:w-[22rem]" : "w-[95%] sm:w-[90%] md:w-[85%] lg:w-5xl max-w-5xl"}
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
          <div className="w-full justify-center ml-8 text-zinc-300 dark:text-zinc-600">
            Loading...
          </div>
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
  const { favorites, isHydrated } = useFavorites();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [layoutMode, setLayoutMode] = useState<"grid" | "row">("grid");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Debug log to confirm loading state and voteHistory
  if (process.env.NODE_ENV === "development") {
    console.log(
      "AskResultsStandard isLoading:",
      isLoading,
      "voteHistory:",
      voteHistory,
      "lastVoteResult:",
      lastVoteResult,
      "favorites:",
      favorites
    );
  }

  // Sanitize and filter voteHistory to prevent XSS and invalid data
  const sanitizedVoteHistory = voteHistory
    .filter((vote) => vote && vote.id && vote.queryText)
    .map((vote) => ({
      ...vote,
      queryText: DOMPurify.sanitize(vote.queryText),
      validatorResponses: vote.validatorResponses?.map((response) => ({
        ...response,
        profileName: DOMPurify.sanitize(response.profileName),
        provider: DOMPurify.sanitize(response.provider),
        id: DOMPurify.sanitize(response.id),
        rationale: DOMPurify.sanitize(response.rationale || ""),
      })) || [],
    }));

  // Combine lastVoteResult with voteHistory and remove duplicates
  const combinedVoteHistory = lastVoteResult
    ? [lastVoteResult, ...sanitizedVoteHistory.filter((v) => v.id !== lastVoteResult.id)]
    : sanitizedVoteHistory;

  // Debug log combined history
  if (process.env.NODE_ENV === "development") {
    console.log("AskResultsStandard combinedVoteHistory:", {
      count: combinedVoteHistory.length,
      hasLastVoteResult: !!lastVoteResult,
      firstItem: combinedVoteHistory[0],
    });
  }

  // Filter to show only favorites if enabled
  const filteredQueries = showFavoritesOnly && isHydrated
    ? combinedVoteHistory.filter((vote) => favorites.some(fav => fav.vote_session_id === vote.id))
    : combinedVoteHistory;

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Effect to refetch if the component is loaded but we have no data
  // Removed to avoid duplicate fetching - useVoteHistory now handles initial fetch

  if (error) {
    return <ErrorDisplay message={error.message} onRetry={refetch} />;
  }

  return (
    <div
      className={`
        container
        rounded-2xl shadow-md
        mx-auto px-2 sm:px-4 py-4
        max-w-6xl
        bg-transparent
        border-0
        justify-center
      `}
      aria-live="polite"
    >
      <div
        className={`flex items-center mb-2 justify-center mb-3 ${
          layoutMode === "row" ? "w-full" : ""
        }`}
      >
        {isLoading || !isHydrated ? (
          <LoadingSpinner type="beat" message="Loading Recent Queries..." />
        ) : (
          <h2 className="text-md text-zinc-800 dark:text-zinc-200 font-light">
            {showFavoritesOnly ? "Favorite Queries" : "Recent Queries"}
          </h2>
        )}
        <LayoutToggle
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
        />
      </div>

      {isLoading || !isHydrated ? (
        <div
          className={`max-w-6xl mx-auto ${
            layoutMode === "grid"
              ? "flex flex-wrap justify-center gap-4"
              : "flex flex-col gap-4 items-center"
          }`}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} layoutMode={layoutMode} />
          ))}
        </div>
      ) : filteredQueries.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400 text-center">
          {showFavoritesOnly
            ? "No favorite queries found."
            : "No recent queries found."}
        </p>
      ) : (
        <PaginatedResultsContainer
          itemsPerPage={20}
          className={`max-w-7xl mx-auto ${
            layoutMode === "grid"
              ? "flex flex-wrap justify-center gap-6"
              : "flex flex-col gap-4 items-center"
          }`}
        >
          {filteredQueries.map((query) => (
            <div key={query.id} className={`card-entrance ${layoutMode === "row" ? "w-full flex justify-center" : ""}`}>
              <AskResultsStandardCard
                query={query}
                layoutMode={layoutMode}
                isOpen={openItems[query.id] || false}
                toggleItem={toggleItem}
              />
            </div>
          ))}
        </PaginatedResultsContainer>
      )}
    </div>
  );
}