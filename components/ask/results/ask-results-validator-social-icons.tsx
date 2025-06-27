"use client";

import { Twitter, Copy } from "lucide-react";
import { VoteResult } from "@/lib/types";
import { useMemo } from "react";
import { CURRENT_DOMAIN } from "@/lib/constants";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface AskResultsValidatorSocialIconsProps {
  response: VoteResult["validatorResponses"][number];
  queryId?: string;
  queryText?: string;
}

export function AskResultsValidatorSocialIcons({
  response,
  queryId,
  queryText,
}: AskResultsValidatorSocialIconsProps) {
  const { copyToClipboard } = useCopyToClipboard();

  const shareText = useMemo(() => {
    const voteText = response.vote === "YES" ? "True" : response.vote === "NO" ? "False" : "No answer";
    const profileText = response.profileName || "AI model";
    
    if (queryText) {
      return encodeURIComponent(
        `${profileText} says "${queryText}" is ${voteText} on v3ra #v3ra`
      );
    }
    return encodeURIComponent(
      `${profileText} voted ${voteText} on this truth report #v3ra`
    );
  }, [response, queryText]);

  const protocol = CURRENT_DOMAIN.includes("localhost") ? "http://" : "https://";
  const shareUrl = queryId
    ? `${protocol}${CURRENT_DOMAIN}/ask/${queryId}`
    : `${protocol}${CURRENT_DOMAIN}/`;

  const twitterIntentUrl = useMemo(
    () =>
      `https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`,
    [shareText, shareUrl]
  );

  const handleCopyResponse = () => {
    const responseText = `${response.profileName} (${response.provider}) voted ${response.vote}: ${response.rationale}`;
    copyToClipboard(
      responseText,
      `Response from ${response.profileName} copied to clipboard`
    );
  };

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <div className="relative group">
        <a
          href={twitterIntentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cyan-400 transition-colors cursor-pointer inline-block p-1"
          aria-label="Share response on X"
        >
          <Twitter className="h-4 w-4" />
        </a>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 glass-morphism rounded text-xs whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg dark:border dark:border-cyan-500/30">
          <p className="text-foreground/90 dark:text-cyan-50">Share on X</p>
        </div>
      </div>
      <div className="relative group">
        <button
          onClick={handleCopyResponse}
          className="hover:text-cyan-400 transition-colors cursor-pointer p-1"
          aria-label="Copy response"
        >
          <Copy className="h-4 w-4" />
        </button>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 glass-morphism rounded text-xs whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg dark:border dark:border-cyan-500/30">
          <p className="text-foreground/90 dark:text-cyan-50">Copy response</p>
        </div>
      </div>
    </div>
  );
}