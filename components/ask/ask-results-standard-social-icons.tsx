import { Twitter, Share2, Share } from "lucide-react";
import { VoteResult } from "@/lib/types";
import { useMemo } from "react";
import { CURRENT_DOMAIN } from "@/lib/constants";

interface AskResultsStandardSocialIconsProps {
  query?: VoteResult;
}

export function AskResultsStandardSocialIcons({
  query,
}: AskResultsStandardSocialIconsProps) {
  const shareText = useMemo(() => {
    if (!query?.queryText || !query?.id) {
      return encodeURIComponent("Check this truth report card!");
    }
    return encodeURIComponent(
      `Check this VERAFY truth report card: ${query.queryText} - ${
        query.isConsensusReached ? (query.consensusValue ? 'True' : 'False') : 'No Consensus'
      }`
    );
  }, [query?.queryText, query?.isConsensusReached, query?.consensusValue, query?.id]);

  const shareUrl = query?.id
    ? `https://${CURRENT_DOMAIN}/ask/${query.id}`
    : `https://${CURRENT_DOMAIN}/`;

  const twitterIntentUrl = useMemo(
    () => `https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`,
    [shareText, shareUrl]
  );

  return (
    <div className="flex justify-end mr-2 text-sm text-zinc-500 space-x-2 border-0">
      <a
        href={twitterIntentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-blue-500 transition-colors"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <Share2 className="h-4 w-4" />
      <Share className="h-4 w-4" />
    </div>
  );
}