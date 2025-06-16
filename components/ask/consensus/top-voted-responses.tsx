"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseRationaleDetailed } from "@/lib/utils";

interface ValidatorResponse {
  id: string;
  profileName: string;
  provider: string;
  vote: string;
  rationale: string;
  confidence?: number;
  matchedConsensus?: boolean;
  upvotes?: number;
  downvotes?: number;
}

interface TopVotedResponsesProps {
  voteSessionId?: string;
}

const ResponseCard = ({
  response,
  voteType,
}: {
  response: ValidatorResponse;
  voteType: "up" | "down";
}) => {
  const { rationale } = parseRationaleDetailed(response.rationale);
  const voteCount = voteType === "up" ? response.upvotes : response.downvotes;
  
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 relative">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-800 dark:text-zinc-200">
              {response.profileName}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({response.provider})
            </span>
          </div>
          <Badge
            variant={response.vote === "YES" ? "default" : "destructive"}
            className="text-xs"
          >
            {response.vote}
          </Badge>
        </div>
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            voteType === "up"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {voteType === "up" ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span className="font-semibold">{voteCount || 0}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
        {rationale.length > 200 ? `${rationale.slice(0, 200)}...` : rationale}
      </p>
    </div>
  );
};

export default function TopVotedResponses({ voteSessionId }: TopVotedResponsesProps) {
  const [topUpvoted, setTopUpvoted] = useState<ValidatorResponse[]>([]);
  const [topDownvoted, setTopDownvoted] = useState<ValidatorResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopResponses = async () => {
      setLoading(true);
      
      if (!voteSessionId) {
        // Use mock data when no voteSessionId is provided
        setTopUpvoted([
          {
            id: "1",
            profileName: "Validator Alpha",
            provider: "OpenAI",
            vote: "YES",
            rationale: "Based on comprehensive analysis of market trends and technical indicators, this appears to be a strong investment opportunity. The fundamentals are solid and growth potential is significant.",
            confidence: 0.9,
            matchedConsensus: true,
            upvotes: 342,
            downvotes: 12,
          },
          {
            id: "2",
            profileName: "Validator Beta",
            provider: "Anthropic",
            vote: "NO",
            rationale: "While there are some positive aspects, the risk factors outweigh the potential benefits. Market volatility and regulatory uncertainty present significant challenges.",
            confidence: 0.85,
            matchedConsensus: false,
            upvotes: 289,
            downvotes: 45,
          },
        ]);

        setTopDownvoted([
          {
            id: "3",
            profileName: "Validator Gamma",
            provider: "Google",
            vote: "YES",
            rationale: "Quick analysis suggests positive outcome without considering deeper implications.",
            confidence: 0.6,
            matchedConsensus: true,
            upvotes: 23,
            downvotes: 187,
          },
          {
            id: "4",
            profileName: "Validator Delta",
            provider: "Mistral",
            vote: "NO",
            rationale: "Insufficient data to make a proper determination. More research needed.",
            confidence: 0.4,
            matchedConsensus: false,
            upvotes: 15,
            downvotes: 156,
          },
        ]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/vote-sessions/${voteSessionId}/top-responses?limit=3`);
        if (!response.ok) {
          throw new Error("Failed to fetch top responses");
        }
        const data = await response.json();
        setTopUpvoted(data.topUpvoted || []);
        setTopDownvoted(data.topDownvoted || []);
      } catch (error) {
        console.error("Error fetching top responses:", error);
        // Fall back to empty arrays on error
        setTopUpvoted([]);
        setTopDownvoted([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopResponses();
  }, [voteSessionId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-white dark:bg-zinc-900 rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gray-800 dark:text-zinc-200 flex items-center gap-2">
            <ChevronUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            Most Upvoted Responses
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Community-endorsed validator responses
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {topUpvoted.length > 0 ? (
            topUpvoted.map((response) => (
              <ResponseCard
                key={response.id}
                response={response}
                voteType="up"
              />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No upvoted responses yet
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-zinc-900 rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-gray-800 dark:text-zinc-200 flex items-center gap-2">
            <ChevronDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            Most Downvoted Responses
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Community-flagged responses for review
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {topDownvoted.length > 0 ? (
            topDownvoted.map((response) => (
              <ResponseCard
                key={response.id}
                response={response}
                voteType="down"
              />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No downvoted responses yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}