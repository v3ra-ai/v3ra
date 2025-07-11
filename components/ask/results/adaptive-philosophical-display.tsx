"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronDown, ChevronUp, Twitter, Copy, Star } from "lucide-react";
import { formatDateTimeCards } from "@/utils/date-utils";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { CURRENT_DOMAIN } from "@/lib/constants";

interface PhilosophicalDisplayProps {
  query: string;
  timestamp: string;
  responses: Array<{
    profileName: string;
    provider: string;
    rationale: string;
  }>;
}

export function AdaptivePhilosophicalDisplay({ 
  query, 
  timestamp,
  responses 
}: PhilosophicalDisplayProps) {
  const formattedDate = formatDateTimeCards(timestamp);
  const [expandedResponses, setExpandedResponses] = useState<Set<number>>(new Set());
  const { copyToClipboard } = useCopyToClipboard();

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResponses(newExpanded);
  };

  // Generate share text
  const shareText = useMemo(() => {
    return encodeURIComponent(
      `Philosophical question on v3ra: "${query}" - Explored by ${responses.length} AI models #v3ra #philosophy #AI`
    );
  }, [query, responses.length]);

  const protocol = CURRENT_DOMAIN.includes("localhost") ? "http://" : "https://";
  const shareUrl = `${protocol}${CURRENT_DOMAIN}/ask?category=philosophy`;

  const twitterIntentUrl = useMemo(
    () => `https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`,
    [shareText, shareUrl]
  );

  const handleCopyLink = useCallback(() => {
    const fullText = `${query}\n\n${responses.map(r => `${r.profileName}:\n${r.rationale}`).join('\n\n')}`;
    copyToClipboard(
      fullText,
      "Philosophical inquiry copied to clipboard"
    );
  }, [query, responses, copyToClipboard]);
  
  return (
    <Card className="w-full sm:w-[90%] lg:w-4xl max-w-4xl mx-auto bg-gradient-to-br from-zinc-900/90 via-zinc-900/95 to-black/90 backdrop-blur-2xl border border-zinc-700/50 hover:border-purple-400/40 transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="outline" 
            className="bg-purple-500/10 border-purple-500/30 text-purple-400"
          >
            <Brain className="w-4 h-4 mr-1" />
            Philosophical Inquiry
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">{formattedDate}</span>
            <div className="flex items-center text-sm text-zinc-500 space-x-2 ml-2">
              <div className="relative group">
                <a
                  href={twitterIntentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors cursor-pointer inline-flex items-center"
                  aria-label="Share on X"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-zinc-800/90 rounded text-xs whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-purple-500/30">
                  <p className="text-purple-200">Share on X</p>
                </div>
              </div>
              <div className="relative group">
                <button
                  onClick={handleCopyLink}
                  className="hover:text-purple-400 transition-colors cursor-pointer inline-flex items-center"
                  aria-label="Copy philosophical inquiry"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-zinc-800/90 rounded text-xs whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-purple-500/30">
                  <p className="text-purple-200">Copy full text</p>
                </div>
              </div>
              <div className="relative group">
                <button
                  className="hover:text-yellow-400 transition-colors cursor-pointer inline-flex items-center opacity-50 cursor-not-allowed"
                  aria-label="Favorite (coming soon)"
                  disabled
                >
                  <Star className="h-4 w-4" />
                </button>
                <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-zinc-800/90 rounded text-xs whitespace-nowrap pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-purple-500/30">
                  <p className="text-purple-200">Favorite (coming soon)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">{query}</h3>
        <p className="text-sm text-zinc-400">
          This philosophical question has been explored from multiple perspectives by {responses.length} AI models.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-4">
          {responses.map((response, idx) => {
            const isExpanded = expandedResponses.has(idx);
            const needsExpansion = response.rationale.length > 500;
            const displayText = isExpanded || !needsExpansion 
              ? response.rationale 
              : response.rationale.slice(0, 500) + "...";

            return (
              <div 
                key={idx} 
                className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 hover:border-purple-500/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-purple-400">
                    {response.profileName}
                  </h4>
                  <span className="text-xs text-zinc-500">{response.provider}</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {displayText}
                </p>
                {needsExpansion && (
                  <button
                    onClick={() => toggleExpanded(idx)}
                    className="mt-2 flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-zinc-700/50">
          <p className="text-xs text-zinc-500 text-center">
            AI models explore different philosophical perspectives on this question. 
            No single answer is definitive.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}