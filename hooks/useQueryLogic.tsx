import { useState, useEffect } from "react";
import { useQueryStore } from "@/store/query-store";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { Dispatch, SetStateAction } from "react";
import { getPlaceholderText } from "@/lib/query-utils";
import type { VoteResult } from "@/lib/types";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
  hasPaid: boolean;
  setHasPaid: Dispatch<SetStateAction<boolean>>;
}

export function useQueryLogic({ payWithWallet, setPayWithWallet, hasPaid, setHasPaid }: UseQueryLogicProps) {
  const queryCost = 0.002; // Cost per query in SOL
  const initialAvailableQueries = 10;
  const initialAiQueryAmountRequested = 4;
  const allowedAmountQueries = 20;

  const [userAiQueryAmountRequested, setUserAiQueryAmountRequested] = useState<number>(initialAiQueryAmountRequested);
  const [question, setQuestion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    totalQueries,
    queryMode,
    viewMode,
    voteHistory,
    lastVoteResult,
    decrementQueries,
    incrementQueries,
    setQueryMode,
    setVoteHistory,
    setLastVoteResult,
  } = useQueryStore();

  const availableQueries = Math.max(0, initialAvailableQueries - userAiQueryAmountRequested);
  const queriesNeeded = Math.max(0, userAiQueryAmountRequested - initialAvailableQueries);
  const costToQuery = (queriesNeeded * queryCost).toFixed(3);

  const placeholderText = getPlaceholderText(queryMode);

  useEffect(() => {
    const initialTotalQueries = initialAvailableQueries - initialAiQueryAmountRequested;
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
    undefined,
  );

  const handleQueryAmountChange = (newAmount: number) => {
    const clampedAmount = Math.max(1, Math.min(allowedAmountQueries, newAmount));
    setUserAiQueryAmountRequested(clampedAmount);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError("Query cannot be empty");
      return;
    }
    if (queriesNeeded > 0 && !payWithWallet) {
      setError("Please enable Pay with Wallet for additional queries");
      return;
    }
    if (payWithWallet && queriesNeeded > 0 && !hasPaid) {
      setError("Please make a payment first");
      return;
    }
    if (totalQueries > 0 && totalQueries < userAiQueryAmountRequested) {
      setError("Not enough queries available");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await broadcastQuery(question);
      decrementQueries(userAiQueryAmountRequested);
      setUserAiQueryAmountRequested(initialAiQueryAmountRequested);
      setQuestion("");
      setHasPaid(false);
      setPayWithWallet(userAiQueryAmountRequested > initialAvailableQueries); // Reset based on new amount
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