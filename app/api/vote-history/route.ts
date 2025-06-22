import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getHistoricalVoteSessions } from "@/lib/store";
import { prisma } from "@/lib/db/client";
import { RESULT_QUERIES_CARDS } from "@/lib/constants";
import sanitizeHtml from "sanitize-html";
import type { VoteResult } from "@/lib/types";

console.log("[vote-history] File loaded");

// Simple rate limiting
const requestCache = new Map<string, { timestamp: number; response: VoteResult[] | { count: number } }>();
const CACHE_TTL = 2000; // 2 seconds cache
const MAX_CACHE_SIZE = 100; // Maximum cache entries

// Clean old cache entries
function cleanCache() {
  const now = Date.now();
  const entriesToDelete: string[] = [];
  
  requestCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL * 2) {
      entriesToDelete.push(key);
    }
  });
  
  entriesToDelete.forEach(key => requestCache.delete(key));
  
  // If still too large, remove oldest entries
  if (requestCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(requestCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = sortedEntries.slice(0, requestCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => requestCache.delete(key));
  }
}

interface VoteHistoryEntry {
  id: string;
  isConsensusReached: boolean;
  consensusValue: boolean | null;
  queryText: string;
  validatorResponses: {
    id: string;
    provider: string;
    profileName: string;
    vote: string;
    rationale: string;
  }[];
  votingResult: {
    yes: number;
    no: number;
    notVoted: number;
  };
  timestamp: string;
}

interface MonthlyStats {
  month: string;
  total: number;
  consensusReached: number;
  participationRate: number;
}

function sanitizeInput(input: string | undefined | null): string {
  if (!input) return "";
  try {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
    });
  } catch (error) {
    console.warn("[vote-history] sanitize-html failed:", error, "Input:", input);
    return "";
  }
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return `Error: ${sanitizeInput(error.message)}`;
  }
  return "Unknown error occurred";
}

/**
 * API endpoint to retrieve vote history, vote session count, or monthly stats
 * GET /api/vote-history?limit=12&offset=0&countOnly=true
 * GET /api/vote-history?limit=30&offset=0&since=2025-05-16T00:00:00Z
 * GET /api/vote-history?limit=100&offset=0&since=2024-12-16T00:00:00Z&groupBy=month
 * @param limit Number of items to return
 * @param offset Number of items to skip (for pagination)
 * @param countOnly If true, returns only the total number of vote sessions
 * @param since Filter sessions after this ISO date
 * @param groupBy If "month", returns monthly aggregated stats
 */
export async function GET(request: Request) {
  headers(); // Force dynamic rendering

  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const offsetRaw = searchParams.get("offset");
    const countOnly = searchParams.get("countOnly") === "true";
    const sinceRaw = sanitizeInput(searchParams.get("since"));
    const groupBy = searchParams.get("groupBy");
    const limit = limitRaw
      ? parseInt(sanitizeInput(limitRaw), 10) || RESULT_QUERIES_CARDS
      : RESULT_QUERIES_CARDS;
    const offset = offsetRaw ? parseInt(sanitizeInput(offsetRaw), 10) || 0 : 0;

    // Create cache key
    const cacheKey = `${limit}-${offset}-${countOnly}-${sinceRaw}-${groupBy}`;
    
    // Check cache
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("[vote-history] Returning cached response");
      return NextResponse.json(cached.response);
    }
    
    // Clean cache periodically
    if (requestCache.size > 50) {
      cleanCache();
    }

    console.log("[vote-history] Handling GET request:", {
      limitRaw,
      limit,
      offsetRaw,
      offset,
      countOnly,
      sinceRaw,
      groupBy,
    });

    // Validate limit
    if (isNaN(limit) || limit < 1) {
      console.warn(
        "[vote-history] Invalid limit, using default:",
        RESULT_QUERIES_CARDS
      );
      return NextResponse.json(
        { status: "error", message: "Invalid limit parameter" },
        { status: 400 }
      );
    }

    // Validate offset
    if (isNaN(offset) || offset < 0) {
      console.warn("[vote-history] Invalid offset:", offsetRaw);
      return NextResponse.json(
        { status: "error", message: "Invalid offset parameter" },
        { status: 400 }
      );
    }

    // Validate since (ISO date)
    let sinceDate: Date | undefined;
    if (sinceRaw) {
      sinceDate = new Date(sinceRaw);
      if (isNaN(sinceDate.getTime())) {
        console.warn("[vote-history] Invalid since parameter:", sinceRaw);
        return NextResponse.json(
          { status: "error", message: "Invalid since parameter, must be ISO date" },
          { status: 400 }
        );
      }
    }

    // Handle countOnly request
    if (countOnly) {
      const count = await prisma.voteSession.count({
        where: sinceDate ? { timestamp: { gte: sinceDate } } : {},
      });
      console.log("[vote-history] Returning vote session count:", count);
      requestCache.set(cacheKey, { timestamp: Date.now(), response: { count } });
      return NextResponse.json({ count });
    }

    // Handle monthly grouping
    if (groupBy === "month") {
      const voteSessions = await prisma.voteSession.findMany({
        where: sinceDate ? { timestamp: { gte: sinceDate } } : {},
        select: {
          timestamp: true,
          isConsensusReached: true,
          votesYes: true,
          votesNo: true,
          notVoted: true,
        },
        orderBy: { timestamp: "asc" },
        take: Math.min(limit, 100), // Cap at 100 for safety
        skip: offset,
      });

      // Group by month
      const monthlyData = new Map<
        string,
        { total: number; consensusReached: number; totalPossibleVotes: number; actualVotes: number }
      >();
      voteSessions.forEach((session) => {
        const date = new Date(session.timestamp);
        const monthKey = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        const current =
          monthlyData.get(monthKey) || {
            total: 0,
            consensusReached: 0,
            totalPossibleVotes: 0,
            actualVotes: 0,
          };

        current.total++;
        if (session.isConsensusReached) {
          current.consensusReached++;
        }

        const totalValidators =
          session.votesYes + session.votesNo + session.notVoted;
        const participated = session.votesYes + session.votesNo;

        current.totalPossibleVotes += totalValidators;
        current.actualVotes += participated;

        monthlyData.set(monthKey, current);
      });

      // Convert to array
      const stats: MonthlyStats[] = Array.from(monthlyData.entries())
        .map(([month, data]) => ({
          month,
          total: data.total,
          consensusReached: data.consensusReached,
          participationRate:
            data.totalPossibleVotes > 0
              ? data.actualVotes / data.totalPossibleVotes
              : 0,
        }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      console.log("[vote-history] Returning monthly stats:", stats.length, "items");
      return NextResponse.json(stats);
    }

    // Existing functionality: fetch raw vote history
    try {
      // Fetch dataset and filter since if needed
      const historicalVotes = await getHistoricalVoteSessions(limit, offset);

      if (historicalVotes && historicalVotes.length > 0) {
        let filteredVotes = historicalVotes;
        if (sinceDate) {
          filteredVotes = historicalVotes.filter(
            (session) =>
              session.timestamp && new Date(session.timestamp) >= sinceDate
          );
        }

        const voteHistory: VoteHistoryEntry[] = filteredVotes.map((session) => ({
          id: session.id,
          isConsensusReached: session.isConsensusReached,
          consensusValue: session.consensusValue,
          queryText: session.queryText,
          validatorResponses: session.validatorResponses.map((res) => ({
            id: res.id,
            provider: res.provider,
            profileName: res.profileName,
            vote: res.vote,
            rationale: res.rationale,
          })),
          votingResult: {
            yes: session.votingResult.yes,
            no: session.votingResult.no,
            notVoted: session.votingResult.notVoted,
          },
          timestamp: session.timestamp
            ? new Date(session.timestamp).toISOString()
            : new Date().toISOString(),
        }));
        console.log(
          "[vote-history] Returning vote history:",
          voteHistory.length,
          "items"
        );
        requestCache.set(cacheKey, { timestamp: Date.now(), response: voteHistory });
        return NextResponse.json(voteHistory);
      } else {
        console.log("[vote-history] No vote sessions found");
        requestCache.set(cacheKey, { timestamp: Date.now(), response: [] });
        return NextResponse.json([]);
      }
    } catch (dbError) {
      console.error("[vote-history] Database error:", sanitizeError(dbError));
      return NextResponse.json(
        {
          status: "error",
          message: "Database error: " + sanitizeError(dbError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[vote-history] Unexpected error:", sanitizeError(error));
    return NextResponse.json(
      { status: "error", message: sanitizeError(error) },
      { status: 500 }
    );
  }
}