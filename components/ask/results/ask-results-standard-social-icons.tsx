"use client";

import { Twitter, Copy, Star } from "lucide-react";
import { VoteResult, Favorite } from "@/lib/types";
import { useMemo, useCallback } from "react";
import { CURRENT_DOMAIN } from "@/lib/constants";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useFavoritesStore } from "@/store/favorites-store";
import { toggleFavorite } from "@/app/actions";
import { toast } from "sonner";
import { debounce } from "lodash";

interface AskResultsStandardSocialIconsProps {
  query?: VoteResult;
}

export function AskResultsStandardSocialIcons({
  query,
}: AskResultsStandardSocialIconsProps) {
  const { copyToClipboard } = useCopyToClipboard();
  const favorites = useFavoritesStore((state) => state.favorites);
  const isFavorited = query?.id
    ? favorites.some((f: Favorite) => f.vote_session_id === query.id)
    : false;

  const shareText = useMemo(() => {
    if (!query?.queryText || !query?.id) {
      return encodeURIComponent("Check this truth report card! #v3ra");
    }
    return encodeURIComponent(
      `Check this v3ra truth report card: ${query.queryText} - ${
        query.isConsensusReached
          ? query.consensusValue
            ? "True"
            : "False"
          : "No Consensus"
      } #v3ra`
    );
  }, [
    query?.queryText,
    query?.isConsensusReached,
    query?.consensusValue,
    query?.id,
  ]);

  const protocol = CURRENT_DOMAIN.includes("localhost")
    ? "http://"
    : "https://";
  const shareUrl = query?.id
    ? `${protocol}${CURRENT_DOMAIN}/ask/${query.id}`
    : `${protocol}${CURRENT_DOMAIN}/`;

  const twitterIntentUrl = useMemo(
    () =>
      `https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`,
    [shareText, shareUrl]
  );

  const handleCopyLink = () => {
    copyToClipboard(
      shareUrl,
      `The link for card ${query?.id || "unknown"} was copied to your clipboard.`
    );
  };

  const debouncedToggleFavorite = useMemo(
    () =>
      debounce(async (id: string) => {
        try {
          const result = await toggleFavorite(id);
          if (result.success) {
            if (result.favorite) {
              useFavoritesStore.getState().addFavorite(result.favorite);
            } else {
              useFavoritesStore.getState().removeFavorite(id);
            }
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        } catch {
          toast.error("Failed to toggle favorite");
        }
      }, 500),
    []
  );

  const handleToggleFavorite = useCallback(() => {
    if (!query?.id) return;
    debouncedToggleFavorite(query.id);
  }, [query?.id, debouncedToggleFavorite]);

  return (
    <div className="flex justify-end mr-2 items-center text-sm text-zinc-500 space-x-3 border-0">
      <div className="relative group">
        <a
          href={twitterIntentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cyan-400 transition-colors cursor-pointer inline-block"
          aria-label="Share on X"
        >
          <Twitter className="h-5 w-5" />
        </a>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 glass-morphism rounded text-xs whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg dark:border dark:border-cyan-500/30">
          <p className="text-foreground/90 dark:text-cyan-50">Share on X</p>
        </div>
      </div>
      <div className="relative group">
        <button
          onClick={handleCopyLink}
          className="hover:text-cyan-400 transition-colors cursor-pointer"
          aria-label="Copy card link"
        >
          <Copy className="h-5 w-5" />
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 glass-morphism rounded text-xs whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg dark:border dark:border-cyan-500/30">
          <p className="text-foreground/90 dark:text-cyan-50">Copy link</p>
        </div>
      </div>
      <div className="relative group">
        <button
          onClick={handleToggleFavorite}
          className="hover:text-yellow-400 transition-colors cursor-pointer"
          aria-label={isFavorited ? "Unfavorite" : "Favorite"}
          disabled={!query?.id}
        >
          <Star
            className={`h-5 w-5 ${
              isFavorited
                ? "fill-yellow-400 text-yellow-400"
                : "hover:text-yellow-400"
            }`}
          />
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 glass-morphism rounded text-xs whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg dark:border dark:border-cyan-500/30">
          <p className="text-foreground/90 dark:text-cyan-50">{isFavorited ? "Unfavorite" : "Favorite"}</p>
        </div>
      </div>
    </div>
  );
}