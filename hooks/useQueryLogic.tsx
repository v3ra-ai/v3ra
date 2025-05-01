"use client";

import { useCallback, useState, useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
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
  const [csrfToken, setCsrfToken] = useState<string>("");

  const {
    userFreeCredits,
    userPaidCredits,
    userCreditsTotal,
    queriesRequested,
    queriesUnpaid,
    queriesCostTotal,
    queryMode,
    viewMode,
    voteHistory,
    lastVoteResult,
    setQueriesRequested,
    setQueryMode,
    setVoteHistory,
    setLastVoteResult,
    resetAfterSubmission,
  } = useQueryStore();

  const placeholderText = getPlaceholderText(queryMode);

  // Fetch CSRF token from server on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/csrf-token", {
          credentials: "include", // Include cookies
        });
        if (!response.ok) {
          throw new Error("Failed to fetch CSRF token");
        }
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error(sanitizeError(err));
        setError(sanitizeQueryText("Failed to initialize CSRF protection"));
      }
    };
    fetchCsrfToken();
  }, []);

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
      setQueriesRequested(clampedAmount);
    },
    [setQueriesRequested],
  );

  const handleSubmit = async () => {
    console.log("Submitting, userCreditsTotal:", userCreditsTotal, "queriesRequested:", queriesRequested, "queriesUnpaid:", queriesUnpaid, "queriesCostTotal:", queriesCostTotal);
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
    if (!csrfToken) {
      toast.error("CSRF token not initialized", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Pass CSRF token to protect API request
      await broadcastQuery(queryText, { csrfToken });
      resetAfterSubmission();
      setQueryText("");
      setHasPaid(false);
      setPayWithWallet(queriesRequested > userCreditsTotal);
      // Fetch new CSRF token after successful submission
      const response = await fetch("/api/csrf-token", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit query";
      setError(sanitizeQueryText(errorMessage));
      console.error(sanitizeError(err));
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