"use client";

import { useVoteHistory } from "@/hooks/useVoteHistory";
import { useVoteStore } from "@/store/vote-store";
import { ErrorDisplay } from "@/components/error-display";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ChevronDown, ChevronUp, Star, History } from "lucide-react";
import { useState } from "react";
import CardViewer from "@/components/ask/card-client-wrapper";
import { default as DOMPurify } from "dompurify";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";

export default function AskResultsStandard() {
  const { voteHistory, isLoading, error, refetch } = useVoteHistory();
  const { lastVoteResult } = useVoteStore();
  const { favorites, isHydrated } = useFavorites();
  const [showHistory, setShowHistory] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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

  // Get the most recent query (either lastVoteResult or first from history)
  const mostRecentQuery = lastVoteResult || sanitizedVoteHistory[0];
  
  // Get the history (excluding the most recent query)
  const historyQueries = mostRecentQuery
    ? sanitizedVoteHistory.filter((v) => v.id !== mostRecentQuery.id)
    : [];

  // Filter to show only favorites if enabled
  const filteredHistory = showFavoritesOnly && isHydrated
    ? historyQueries.filter((vote) => favorites.some(fav => fav.vote_session_id === vote.id))
    : historyQueries;

  if (error) {
    return <ErrorDisplay message={error.message} onRetry={refetch} />;
  }

  if (isLoading || !isHydrated) {
    return (
      <div className="container rounded-2xl shadow-md mx-auto px-2 sm:px-4 py-4 max-w-4xl bg-transparent border-0 justify-center">
        <div className="flex items-center justify-center mb-4">
          <LoadingSpinner type="beat" message="Loading results..." />
        </div>
      </div>
    );
  }

  return (
    <div className="container rounded-2xl shadow-md mx-auto px-2 sm:px-4 py-4 max-w-4xl bg-transparent border-0">
      {/* Most Recent Query */}
      {mostRecentQuery ? (
        <div className="mb-6">
          <h2 className="text-lg text-zinc-700 dark:text-zinc-300 font-medium mb-3">
            Latest Query
          </h2>
          <div className="w-full">
            <CardViewer
              query={mostRecentQuery}
              layoutMode="row"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-zinc-500 dark:text-zinc-400">
            No queries yet. Ask a question above to get started!
          </p>
        </div>
      )}

      {/* Query History Section */}
      {historyQueries.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
            >
              <History className="h-4 w-4" />
              Query History ({historyQueries.length})
              {showHistory ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {showHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 ${
                  showFavoritesOnly
                    ? "text-amber-500"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <Star
                  className={`h-4 w-4 ${
                    showFavoritesOnly ? "fill-current" : ""
                  }`}
                />
                {showFavoritesOnly ? "Show All" : "Favorites Only"}
              </Button>
            )}
          </div>

          {showHistory && (
            <div className="space-y-4">
              {filteredHistory.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400 text-center py-4">
                  {showFavoritesOnly
                    ? "No favorite queries in history."
                    : "No queries in history."}
                </p>
              ) : (
                filteredHistory.map((query) => (
                  <div key={query.id} className="w-full">
                    <CardViewer
                      query={query}
                      layoutMode="row"
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}