"use client";

import { useCallback, useState, useEffect } from "react";
import { useCreditsStore } from "@/store/credit-store";
import { useQueryStore } from "@/store/query-store";
import { useVoteStore } from "@/store/vote-store";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { Dispatch, SetStateAction } from "react";
import { getPlaceholderText } from "@/lib/query-utils";
import { toast } from "sonner";
import type { VoteResult } from "@/lib/types";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";
import { sanitizeQueryText } from "@/utils/security-utils";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
}

export function useQueryLogic({
  payWithWallet,
  setPayWithWallet,
}: UseQueryLogicProps) {
  const [queryText, setQueryText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    userFreeCredits,
    userPaidCredits,
    userCreditsTotal,
    hasPaid: storeHasPaid,
  } = useCreditsStore();
  const {
    queriesRequested,
    queriesUnpaid,
    queriesCostTotal,
    queryMode,
    viewMode,
    setQueriesRequested,
    setQueryMode,
    resetAfterSubmission,
  } = useQueryStore();
  const { voteHistory, lastVoteResult, setVoteHistory, setLastVoteResult } =
    useVoteStore();

  const placeholderText = getPlaceholderText(queryMode);

  // Log queryMode on hook initialization
  console.log("[useQueryLogic] Initial queryMode:", queryMode);

  // Fetch CSRF token dynamically
  const fetchCsrfToken = async (): Promise<string> => {
    console.log("[useQueryLogic] Starting CSRF token fetch");
    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
      });
      console.log(
        "[useQueryLogic] CSRF fetch response status:",
        response.status
      );
      const data = await response.json();
      if (!response.ok || !data.csrfToken) {
        throw new Error(
          data.error || `Failed to fetch CSRF token: ${response.status}`
        );
      }
      console.log(
        "[useQueryLogic] CSRF token fetched successfully:",
        data.csrfToken
      );
      return data.csrfToken;
    } catch (err) {
      console.error("[useQueryLogic] CSRF token fetch failed:", err);
      throw new Error(
        err instanceof Error ? err.message : "Unknown error fetching CSRF token"
      );
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q === "shop") {
        setQueryMode("shop");
      }
      console.log(
        "[useQueryLogic] URL param 'q':",
        q,
        "Current queryMode:",
        queryMode
      );
    }
  }, [setQueryMode]);

  const handleSetVoteHistory: Dispatch<SetStateAction<VoteResult[]>> = (
    history
  ) => {
    setVoteHistory(history);
  };

  const handleSetLastVoteResult: Dispatch<SetStateAction<VoteResult | null>> = (
    result
  ) => {
    setLastVoteResult(result);
  };

  const { broadcastQuery } = useBroadcastQuery(
    handleSetVoteHistory,
    handleSetLastVoteResult,
    undefined,
    undefined
  );

  const handleQueryAmountChange = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(
        1,
        Math.min(ALLOWED_AMOUNT_QUERIES, newAmount)
      );
      console.log("[useQueryLogic] Updating queriesRequested:", clampedAmount);
      setQueriesRequested(clampedAmount, userCreditsTotal);
    },
    [setQueriesRequested, userCreditsTotal]
  );

  const handleSubmit = async () => {
    console.log("[useQueryLogic] handleSubmit called", {
      queryText,
      queryMode,
      userCreditsTotal,
      queriesRequested,
      queriesUnpaid,
      queriesCostTotal,
      payWithWallet,
      storeHasPaid,
    });

    console.log("[useQueryLogic] Proceeding to validation");

    // Validate query submission in a separate try-catch to catch silent errors
    try {
      console.log("[useQueryLogic] Checking query text:", queryText);
      if (!queryText.trim()) {
        console.log("[useQueryLogic] Validation failed: Query cannot be empty");
        toast.error("Query cannot be empty", {
          style: { background: "#fee2e2", color: "#dc2626" },
          duration: 5000,
        });
        return;
      }
      console.log("[useQueryLogic] Query text validation passed");

      console.log("[useQueryLogic] Checking queriesUnpaid and payWithWallet:", {
        queriesUnpaid,
        payWithWallet,
      });
      if (queriesUnpaid > 0 && !payWithWallet) {
        console.log(
          "[useQueryLogic] Validation failed: Pay with Wallet required"
        );
        toast.error("Please enable Pay with Wallet for additional queries", {
          style: { background: "#fee2e2", color: "#dc2626" },
          duration: 5000,
        });
        return;
      }
      console.log("[useQueryLogic] Wallet validation passed");

      console.log("[useQueryLogic] Checking payment status:", {
        payWithWallet,
        queriesUnpaid,
        storeHasPaid,
      });
      if (payWithWallet && queriesUnpaid > 0 && !storeHasPaid) {
        console.log("[useQueryLogic] Validation failed: Payment required", {
          queriesUnpaid,
          storeHasPaid,
        });
        toast.error("Please make a payment first", {
          style: { background: "#fee2e2", color: "#dc2626" },
          duration: 5000,
        });
        return;
      }
      console.log("[useQueryLogic] Payment validation passed");
    } catch (err: unknown) {
      console.error("[useQueryLogic] Validation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Validation failed unexpectedly";
      setError(sanitizeQueryText(errorMessage));
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    console.log("[useQueryLogic] Entering try block");
    try {
      // Fetch fresh CSRF token for each submission
      const csrfToken = await fetchCsrfToken();
      console.log(
        "[useQueryLogic] Broadcasting query with queryMode:",
        queryMode,
        "queriesRequested:",
        queriesRequested
      );
      await broadcastQuery(queryText, {
        csrfToken,
        queryMode,
        queriesRequested,
      }); // Pass queriesRequested
      console.log("[useQueryLogic] Broadcast successful");
      resetAfterSubmission(userCreditsTotal);
      setQueryText("");
      setPayWithWallet(queriesRequested > userCreditsTotal);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit query";
      setError(sanitizeQueryText(errorMessage));
      console.error("[useQueryLogic] Submission failed:", {
        errorMessage,
        queryText,
        queryMode,
        queriesRequested,
        queriesUnpaid,
        payWithWallet,
        storeHasPaid,
        responseStatus:
          err instanceof Error && err.message.includes("Server responded")
            ? err.message
            : "Unknown",
      });
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      console.log("[useQueryLogic] Submission completed, isSubmitting:", false);
    }
  };

  return {
    queriesRequested,
    queryText,
    setQueryText,
    isSubmitting,
    error,
    setError,
    placeholderText,
    availableQueries: userCreditsTotal,
    queriesCostTotal,
    queriesUnpaid,
    userFreeCredits,
    userPaidCredits,
    userCreditsTotal,
    queryMode,
    viewMode,
    voteHistory,
    lastVoteResult,
    handleSubmit,
    handleQueryAmountChange,
  };
}
