import { useState, useEffect, useCallback } from "react";
import { useQueryStore, QueryMode } from "@/store/query-store";
import {useSubmitQuery} from "@/hooks/useSubmitQuery";
import { toast } from "sonner";
import {
  INITIAL_AI_QUERY_AMOUNT_REQUESTED,
  ALLOWED_AMOUNT_QUERIES,
} from "@/lib/constants";

interface NavbarScrollbarState {
  queryText: string;
  isSubmitting: boolean;
  payWithWallet: boolean;
  hasPaid: boolean;
  hasAttemptedSubmit: boolean;
}

interface NavbarScrollbarReturn extends NavbarScrollbarState {
  setQueryText: (text: string) => void;
  setPayWithWallet: (value: boolean) => void;
  setHasPaid: (value: boolean) => void;
  queriesRequested: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesUnpaid: number;
  queriesCostTotal: number;
  queryMode: QueryMode;
  updateQueryAmountRequested: (newAmount: number) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function useNavbarScrollbar(): NavbarScrollbarReturn {
  const [state, setState] = useState<NavbarScrollbarState>({
    queryText: "",
    isSubmitting: false,
    payWithWallet: true,
    hasPaid: false,
    hasAttemptedSubmit: false,
  });

  const {
    queriesRequested,
    userCreditsTotal,
    userFreeCredits,
    userPaidCredits,
    queriesUnpaid,
    queriesCostTotal,
    queryMode,
    setUserAiQueryAmountRequested,
    decrementQueries,
  } = useQueryStore();

  const { submitQuery } = useSubmitQuery();

  // Sync payWithWallet with queriesUnpaid
  useEffect(() => {
    const shouldPayWithWallet = queriesUnpaid > 0;
    if (state.payWithWallet !== shouldPayWithWallet) {
      setState((prev) => ({ ...prev, payWithWallet: shouldPayWithWallet }));
    }
  }, [queriesUnpaid, state.payWithWallet]);

  // Update query amount with clamping
  const updateQueryAmountRequested = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(1, Math.min(ALLOWED_AMOUNT_QUERIES, newAmount));
      setUserAiQueryAmountRequested(clampedAmount);
    },
    [setUserAiQueryAmountRequested]
  );

  // Submit query with validation
  const handleSubmit = async () => {
    if (!state.queryText.trim()) {
      toast.error("Query cannot be empty", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    if (queriesUnpaid > 0 && !state.payWithWallet) {
      toast.error("Please enable Pay with Wallet for additional queries", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    if (state.payWithWallet && queriesUnpaid > 0 && !state.hasPaid) {
      toast.error("Please make a payment first", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    if (userCreditsTotal > 0 && userCreditsTotal < queriesRequested) {
      toast.error("Not enough queries available", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await submitQuery(state.queryText);
      decrementQueries(queriesRequested);
      setUserAiQueryAmountRequested(INITIAL_AI_QUERY_AMOUNT_REQUESTED);
      setState((prev) => ({
        ...prev,
        queryText: "",
        hasPaid: false,
        hasAttemptedSubmit: false,
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit query";
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      console.error("Submission failed:", errorMessage);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Handle Enter key for submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !state.isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return {
    queryText: state.queryText,
    setQueryText: (text) => setState((prev) => ({ ...prev, queryText: text })),
    isSubmitting: state.isSubmitting,
    payWithWallet: state.payWithWallet,
    setPayWithWallet: (value) => setState((prev) => ({ ...prev, payWithWallet: value })),
    hasPaid: state.hasPaid,
    setHasPaid: (value) => setState((prev) => ({ ...prev, hasPaid: value })),
    hasAttemptedSubmit: state.hasAttemptedSubmit,
    queriesRequested,
    userCreditsTotal,
    userFreeCredits,
    userPaidCredits,
    queriesUnpaid,
    queriesCostTotal,
    queryMode,
    updateQueryAmountRequested,
    handleKeyDown,
  };
}