import { Twitter, Copy } from "lucide-react";
import { VoteResult } from "@/lib/types";
import { useMemo } from "react";
import { CURRENT_DOMAIN } from "@/lib/constants";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface AskResultsStandardSocialIconsProps {
  query?: VoteResult;
}

export function AskResultsStandardSocialIcons({
  query,
}: AskResultsStandardSocialIconsProps) {
  const { copyToClipboard } = useCopyToClipboard();

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

  const protocol = CURRENT_DOMAIN.includes('localhost') ? 'http://' : 'https://';
  const shareUrl = query?.id
    ? `${protocol}${CURRENT_DOMAIN}/ask/${query.id}`
    : `${protocol}${CURRENT_DOMAIN}/`;

  const twitterIntentUrl = useMemo(
    () => `https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`,
    [shareText, shareUrl]
  );

  const handleCopyLink = () => {
    copyToClipboard({
      textToCopy: shareUrl,
      successDescription: `The link for card ${query?.id || 'unknown'} was copied to your clipboard.`,
      errorDescription: `Failed to copy the link for card ${query?.id || 'unknown'}. Try again.`,
    });
  };

  return (
    <div className="flex justify-end mr-2 text-sm text-zinc-500 space-x-2 border-0">
      <a
        href={twitterIntentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-blue-500 transition-colors cursor-pointer"
        aria-label="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <button
        onClick={handleCopyLink}
        className="hover:text-blue-500 transition-colors cursor-pointer"
        aria-label="Copy share link"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}