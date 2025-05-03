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
import { sanitizeError, sanitizeQueryText } from "@/utils/security-utils";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
  hasPaid: boolean;
  setHasPaid: Dispatch<SetStateAction<boolean>>;
}

export function useQueryLogic({ payWithWallet, setPayWithWallet, hasPaid, setHasPaid }: UseQueryLogicProps) {
  const [queryText, setQueryText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { userFreeCredits, userPaidCredits, userCreditsTotal } = useCreditsStore();
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
  const { voteHistory, lastVoteResult, setVoteHistory, setLastVoteResult } = useVoteStore();

  const placeholderText = getPlaceholderText(queryMode);

  // Fetch CSRF token dynamically
  const fetchCsrfToken = async (): Promise<string> => {
    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.csrfToken) {
        throw new Error(data.error || `Failed to fetch CSRF token: ${response.status}`);
      }
      return data.csrfToken;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Unknown error fetching CSRF token");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q === "shop") {
        setQueryMode("shop");
      }
    }
  }, [setQueryMode]);

  const handleSetVoteHistory: Dispatch<SetStateAction<VoteResult[]>> = (history) => {
    setVoteHistory(history);
  };

  const handleSetLastVoteResult: Dispatch<SetStateAction<VoteResult | null>> = (result) => {
    setLastVoteResult(result);
  };

  const { broadcastQuery } = useBroadcastQuery(
    handleSetVoteHistory,
    handleSetLastVoteResult,
    undefined,
    undefined,
  );

  const handleQueryAmountChange = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(1, Math.min(ALLOWED_AMOUNT_QUERIES, newAmount));
      setQueriesRequested(clampedAmount, userCreditsTotal);
    },
    [setQueriesRequested, userCreditsTotal],
  );

  const handleSubmit = async () => {
    console.log("[useQueryLogic] Submitting", {
      userCreditsTotal,
      queriesRequested,
      queriesUnpaid,
      queriesCostTotal,
      queryText,
      payWithWallet,
      hasPaid,
    });

    // Validate query submission
    if (!queryText.trim()) {
      toast.error("Query cannot be empty", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      return;
    }
    if (queriesUnpaid > 0 && !payWithWallet) {
      toast.error("Please enable Pay with Wallet for additional queries", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      return;
    }
    if (payWithWallet && queriesUnpaid > 0 && !hasPaid) {
      toast.error("Please make a payment first", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Fetch fresh CSRF token for each submission
      const csrfToken = await fetchCsrfToken();
      await broadcastQuery(queryText, { csrfToken });
      resetAfterSubmission(userCreditsTotal);
      setQueryText("");
      setHasPaid(false);
      setPayWithWallet(queriesRequested > userCreditsTotal);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit query";
      setError(sanitizeQueryText(errorMessage));
      console.error("[useQueryLogic] Submission failed:", {
        errorMessage,
        queryText,
        queriesRequested,
        queriesUnpaid,
        payWithWallet,
        hasPaid,
        responseStatus: err instanceof Error && err.message.includes("Server responded") ? err.message : "Unknown",
      });
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
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