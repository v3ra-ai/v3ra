import { VoteResult, QueryMode } from "@/lib/types";

// Log to confirm file is loaded
console.log("[query-service] File loaded");

interface QueryResponse {
  voteResult: VoteResult;
}

// Fetch CSRF token from /api/csrf-token
async function fetchCsrfToken(): Promise<string> {
  console.log("[query-service] Starting CSRF token fetch");
  try {
    const response = await fetch("/api/csrf-token", {
      method: "GET",
      credentials: "include",
    });
    console.log("[query-service] CSRF fetch response status:", response.status);
    const data = await response.json();
    if (!response.ok || !data.csrfToken) {
      throw new Error(
        data.error || `Failed to fetch CSRF token: ${response.status}`
      );
    }
    console.log("[query-service] CSRF token fetched successfully");
    return data.csrfToken;
  } catch (error) {
    console.error("[query-service] CSRF token fetch failed:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unknown error fetching CSRF token"
    );
  }
}

export async function submitQueryService(
  query: string,
  queryMode?: QueryMode,
  queriesRequested?: number // Number of validators to query
): Promise<QueryResponse> {
  console.log("[query-service] Submitting query:", {
    query,
    queryMode,
    queriesRequested,
  });

  try {
    const csrfToken = await fetchCsrfToken();
    console.log("[query-service] Sending request with body:", {
      queryText: query,
      queryMode,
      queriesRequested,
    });
    const response = await fetch("/api/broadcast-query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ queryText: query, queryMode, queriesRequested }),
      credentials: "include",
    });

    console.log("[query-service] Response status:", response.status);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "[query-service] Request failed:",
        errorData.error || `Server responded with ${response.status}`
      );
      throw new Error(
        errorData.error || `Server responded with ${response.status}`
      );
    }

    const data = await response.json();
    console.log("[query-service] Response data:", data);
    return { voteResult: data as VoteResult };
  } catch (error: unknown) {
    console.error("[query-service] Unexpected error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to submit query";
    throw new Error(message);
  }
}
