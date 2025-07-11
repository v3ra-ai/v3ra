"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { formatDateTimeCards } from "@/utils/date-utils";

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

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResponses(newExpanded);
  };
  
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
          <span className="text-xs text-zinc-500">{formattedDate}</span>
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