import { VoteResult, QueryMode } from "@/lib/types";
import { broadcastCustomQuery } from "@/app/actions";

export async function submitQueryService(
  query: string,
  queryMode: QueryMode,
  queriesRequested?: number,
  selectedLLMIds?: string[]
): Promise<VoteResult | { error: string }> {
  try {
    const result = await broadcastCustomQuery(
      query,
      queryMode,
      queriesRequested,
      selectedLLMIds
    );
    
    return result;
  } catch (error) {
    console.error("Error submitting query:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to submit query"
    };
  }
}