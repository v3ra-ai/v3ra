import { VoteResult } from "@/lib/types";

interface SubmitQueryResponse {
  success: boolean;
  voteResult: VoteResult;
}

// Fetch CSRF token from /api/csrf-token
async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch("/api/csrf-token", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!response.ok || !data.csrfToken) {
      throw new Error(data.error || "Failed to fetch CSRF token");
    }
    return data.csrfToken;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error fetching CSRF token");
  }
}

export async function submitQueryService(queryText: string): Promise<SubmitQueryResponse> {
  try {
    const csrfToken = await fetchCsrfToken();
    const response = await fetch("/api/broadcast-query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ queryText }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      voteResult: data as VoteResult,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}