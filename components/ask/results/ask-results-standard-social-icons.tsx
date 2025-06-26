"use client";

import { Twitter, Copy, StickyNote, Star } from "lucide-react";
import { VoteResult, Favorite } from "@/lib/types";
import { useMemo, useCallback } from "react";
import { CURRENT_DOMAIN } from "@/lib/constants";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const favorites = useFavoritesStore((state) => state.favorites);
  const isFavorited = query?.id
    ? favorites.some((f: Favorite) => f.vote_session_id === query.id)
    : false;

  const shareText = useMemo(() => {
    if (!query?.queryText || !query?.id) {
      return encodeURIComponent("Check this truth report card!");
    }
    return encodeURIComponent(
      `Check this v3ra truth report card: ${query.queryText} - ${
        query.isConsensusReached
          ? query.consensusValue
            ? "True"
            : "False"
          : "No Consensus"
      }`
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
        } catch (error) {
          const typedError = error as Error;
          console.error("[social-icons] Error toggling favorite:", typedError);
          toast.error("Failed to toggle favorite");
        }
      }, 500),
    []
  );

  const handleToggleFavorite = useCallback(() => {
    if (!query?.id) return;
    debouncedToggleFavorite(query.id);
  }, [query?.id, debouncedToggleFavorite]);

  const isOnCardPage = query?.id && pathname === `/ask/${query.id}`;

  return (
    <div className="flex justify-end mr-2 items-center text-sm text-zinc-500 space-x-3 border-0">
      <a
        href={twitterIntentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-blue-500 transition-colors cursor-pointer"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-5 w-5" />
      </a>
      <button
        onClick={handleCopyLink}
        className="hover:text-blue-500 transition-colors cursor-pointer"
        aria-label="Copy share link"
      >
        <Copy className="h-5 w-5" />
      </button>
      {query?.id && !isOnCardPage && (
        <Link
          href={`/ask/${query.id}`}
          className="hover:text-blue-500 transition-colors cursor-pointer"
          aria-label="View card details"
        >
          <StickyNote className="h-5 w-5" />
        </Link>
      )}
      <button
        onClick={handleToggleFavorite}
        className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        aria-label={isFavorited ? "Unfavorite" : "Favorite"}
        disabled={!query?.id}
      >
        <Star
          className={`h-5 w-5 ${
            isFavorited
              ? "fill-yellow-400 text-yellow-400"
              : "text-zinc-600 dark:text-zinc-300 hover:text-yellow-400 dark:hover:text-yellow-400"
          }`}
        />
      </button>
    </div>
  );
}