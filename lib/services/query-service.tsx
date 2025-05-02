import { VoteResult } from "@/lib/types";

interface SubmitQueryResponse {
  success: boolean;
  voteResult: VoteResult;
}

export async function submitQueryService(queryText: string): Promise<SubmitQueryResponse> {
  try {
    // Mock API call (replace with actual implementation from useBroadcastQuery)
    const response = await fetch("/api/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: queryText }),
    });

    if (!response.ok) {
      throw new Error("Failed to submit query");
    }

    const data = await response.json();
    return {
      success: true,
      voteResult: data.voteResult as VoteResult,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}