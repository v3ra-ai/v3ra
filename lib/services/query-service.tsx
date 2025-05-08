import { broadcastCustomQuery } from "@/app/actions";
import type { VoteResult, QueryMode } from "@/lib/types";

// Log to confirm file is loaded
console.log("[query-service] File loaded");

interface QueryResponse {
  voteResult: VoteResult;
}

export async function submitQueryService(
  query: string,
  queryMode?: QueryMode
): Promise<QueryResponse> {
  console.log("[query-service] Submitting query:", { query, queryMode }); // Log query and queryMode

  try {
    const result = await broadcastCustomQuery(query, queryMode || "factCheck");
    console.log("[query-service] Query submission result:", result); // Log result

    if ("error" in result) {
      console.error("[query-service] Submission error:", result.error);
      throw new Error(result.error);
    }

    return { voteResult: result };
  } catch (error: unknown) {
    console.error("[query-service] Unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit query";
    throw new Error(message);
  }
}
