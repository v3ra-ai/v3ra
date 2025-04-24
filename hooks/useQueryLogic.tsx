"use client";

import { useCallback, useState, useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { Dispatch, SetStateAction } from "react";
import { getPlaceholderText } from "@/lib/query-utils";
import { toast } from "sonner";
import type { VoteResult } from "@/lib/types";
import {
  ALLOWED_AMOUNT_QUERIES,
} from "@/lib/constants";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
  hasPaid: boolean;
  setHasPaid: Dispatch<SetStateAction<boolean>>;
}

export function useQueryLogic({ payWithWallet, setPayWithWallet, hasPaid, setHasPaid }: UseQueryLogicProps) {
  const [question, setQuestion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    undefined
  );

  const handleQueryAmountChange = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(1, Math.min(ALLOWED_AMOUNT_QUERIES, newAmount));
      setQueriesRequested(clampedAmount);
    },
    [setQueriesRequested]
  );

  const handleSubmit = async () => {
    console.log("Submitting, userCreditsTotal:", userCreditsTotal, "queriesRequested:", queriesRequested, "queriesUnpaid:", queriesUnpaid, "queriesCostTotal:", queriesCostTotal);
    if (!question.trim()) {
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
      await broadcastQuery(question);
      resetAfterSubmission();
      setQuestion("");
      setHasPaid(false);
      setPayWithWallet(queriesRequested > userCreditsTotal);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit query";
      setError(errorMessage);
      console.error("Submission failed:", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    queriesRequested,
    question,
    setQuestion,
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