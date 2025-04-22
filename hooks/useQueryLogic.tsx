import { useState, useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { Dispatch, SetStateAction } from "react";
import { getPlaceholderText } from "@/lib/query-utils";
import { toast } from "sonner";
import type { VoteResult } from "@/lib/types";
import {
  QUERY_COST,
  INITIAL_AVAILABLE_QUERIES,
  INITIAL_AI_QUERY_AMOUNT_REQUESTED,
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
    totalQueries,
    queryMode,
    viewMode,
    voteHistory,
    lastVoteResult,
    userAiQueryAmountRequested,
    decrementQueries,
    incrementQueries,
    setQueryMode,
    setVoteHistory,
    setLastVoteResult,
    setUserAiQueryAmountRequested,
  } = useQueryStore();

  const availableQueries = Math.max(0, INITIAL_AVAILABLE_QUERIES - userAiQueryAmountRequested);
  const queriesNeeded = Math.max(0, userAiQueryAmountRequested - INITIAL_AVAILABLE_QUERIES);
  const costToQuery = (queriesNeeded * QUERY_COST).toFixed(3);

  const placeholderText = getPlaceholderText(queryMode);

  useEffect(() => {
    const initialTotalQueries = INITIAL_AVAILABLE_QUERIES - INITIAL_AI_QUERY_AMOUNT_REQUESTED;
    incrementQueries(initialTotalQueries - totalQueries);
  }, [incrementQueries, totalQueries]);

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

  const handleQueryAmountChange = (newAmount: number) => {
    const clampedAmount = Math.max(1, Math.min(ALLOWED_AMOUNT_QUERIES, newAmount));
    setUserAiQueryAmountRequested(clampedAmount);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error("Query cannot be empty", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      return;
    }
    if (queriesNeeded > 0 && !payWithWallet) {
      toast.error("Please enable Pay with Wallet for additional queries", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      return;
    }
    if (payWithWallet && queriesNeeded > 0 && !hasPaid) {
      toast.error("Please make a payment first", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      return;
    }
    if (totalQueries > 0 && totalQueries < userAiQueryAmountRequested) {
      toast.error("Not enough queries available", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await broadcastQuery(question);
      decrementQueries(userAiQueryAmountRequested);
      setUserAiQueryAmountRequested(INITIAL_AI_QUERY_AMOUNT_REQUESTED);
      setQuestion("");
      setHasPaid(false);
      setPayWithWallet(userAiQueryAmountRequested > INITIAL_AVAILABLE_QUERIES);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit query";
      setError(errorMessage);
      console.error("Submission failed:", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    userAiQueryAmountRequested,
    setUserAiQueryAmountRequested,
    question,
    setQuestion,
    isSubmitting,
    error,
    setError,
    placeholderText,
    availableQueries,
    costToQuery,
    queriesNeeded,
    totalQueries,
    queryMode,
    viewMode,
    voteHistory,
    lastVoteResult,
    handleSubmit,
    handleQueryAmountChange,
  };
}