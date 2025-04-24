"use client";

import { useState, useEffect, useCallback } from "react";
import { ViewMode, useQueryStore } from "@/store/query-store";
import WalletToggle from "@/components/ask/wallet-toggle";
import { QueryFormModeSelector } from "@/components/ask/query-form-mode-selector";
import { QueryFormAISlider } from "@/components/ask/query-form-ai-slider";
import {
  QUERY_COST,
  INITIAL_AVAILABLE_QUERIES,
  INITIAL_AI_QUERY_AMOUNT_REQUESTED,
  ALLOWED_AMOUNT_QUERIES,
  QUERY_COST_FIXED_DECIMALS,
} from "@/lib/constants";
import { getPlaceholderText } from "@/lib/query-utils";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { toast } from "sonner";

// Define props interface
interface NavbarScrollbarProps {
  mounted: boolean;
  showSearch: boolean;
  viewMode: ViewMode;
}

/**
 * Renders a scroll-based search bar that appears when scrolling past 50px.
 * Includes a query mode selector, input field with dynamic placeholder, AI query slider, and wallet toggle with queries left display.
 * Users submit queries by pressing Enter.
 */
export function NavbarScrollbar({ mounted, showSearch }: NavbarScrollbarProps) {
  // Local state for input and submission
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payWithWallet, setPayWithWallet] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [isSubmitInteracted, setIsSubmitInteracted] = useState(false);

  // Get store data
  const {
    queriesRequested,
    userCreditsTotal,
    userFreeCredits,
    userPaidCredits,
    userCreditConversion,
    queriesUnpaid,
    queriesCostEach,
    queriesCostTotal,
    queryMode,
    setUserAiQueryAmountRequested,
    setVoteHistory,
    setLastVoteResult,
    decrementQueries,
  } = useQueryStore();

  // Sync payWithWallet with queriesUnpaid
  useEffect(() => {
    const shouldPayWithWallet = queriesUnpaid > 0;
    if (payWithWallet !== shouldPayWithWallet) {
      setPayWithWallet(shouldPayWithWallet);
    }
  }, [queriesUnpaid, payWithWallet]);

  // Handle query amount changes
  const handleQueryAmountChange = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(1, Math.min(ALLOWED_AMOUNT_QUERIES, newAmount));
      setUserAiQueryAmountRequested(clampedAmount);
    },
    [setUserAiQueryAmountRequested]
  );

  // Submission logic using useBroadcastQuery
  const { broadcastQuery } = useBroadcastQuery(
    setVoteHistory,
    setLastVoteResult,
    undefined,
    undefined
  );

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error("Query cannot be empty", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setIsSubmitInteracted(true);
      return;
    }
    if (queriesUnpaid > 0 && !payWithWallet) {
      toast.error("Please enable Pay with Wallet for additional queries", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setIsSubmitInteracted(true);
      return;
    }
    if (payWithWallet && queriesUnpaid > 0 && !hasPaid) {
      toast.error("Please make a payment first", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setIsSubmitInteracted(true);
      return;
    }
    if (userCreditsTotal > 0 && userCreditsTotal < queriesRequested) {
      toast.error("Not enough queries available", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setIsSubmitInteracted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await broadcastQuery(question);
      decrementQueries(queriesRequested);
      setUserAiQueryAmountRequested(INITIAL_AI_QUERY_AMOUNT_REQUESTED);
      setQuestion("");
      setHasPaid(false);
      setIsSubmitInteracted(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit query";
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      console.error("Submission failed:", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Enter key for submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!mounted || !showSearch) return null;

  return (
    <div className="container mx-auto px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
        <div className="w-full md:w-1/3">
          <div className="flex items-center space-x-2 flex-wrap">
            <QueryFormModeSelector queryMode={queryMode} />
            <input
              type="text"
              className={`flex-1 p-2 border rounded-md bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-500 min-w-[150px] ${
                isSubmitInteracted && !question.trim() ? "border-red-400" : "border-zinc-300 dark:border-zinc-600"
              }`}
              placeholder={getPlaceholderText(queryMode)}
              value={isSubmitting ? "Submitting..." : question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              aria-label={`Enter query to submit, current mode: ${queryMode}`}
              aria-busy={isSubmitting}
            />
          </div>
        </div>
        <div className="flex flex-row md:w-2/3 items-center h-full md:text-left flex-wrap gap-2">
          <QueryFormAISlider
            queriesRequested={queriesRequested}
            handleQueryAmountChange={handleQueryAmountChange}
            allowedAmountQueries={ALLOWED_AMOUNT_QUERIES}
            context="scrollbar"
          />
          <div className="flex items-center h-full">
            <WalletToggle
              payWithWallet={payWithWallet}
              setPayWithWallet={setPayWithWallet}
              hasPaid={hasPaid}
              setHasPaid={setHasPaid}
              queriesCostTotal={queriesCostTotal}
              userCreditsTotal={userCreditsTotal}
              userFreeCredits={userFreeCredits}
              userPaidCredits={userPaidCredits}
              queriesRequested={queriesRequested}
              queriesUnpaid={queriesUnpaid}
              highlightPayButton={false}
              context="scrollbar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}