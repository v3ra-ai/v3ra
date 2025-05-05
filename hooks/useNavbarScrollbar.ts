import { useState, useCallback, useEffect, Dispatch, SetStateAction, KeyboardEvent } from "react";
import { useCreditsStore } from "@/store/credit-store";
import { useQueryStore } from "@/store/query-store";
import { QueryMode } from "@/lib/types";
import { useSubmitQuery } from "@/hooks/useSubmitQuery";
import { toast } from "sonner";
import {
  ALLOWED_AMOUNT_QUERIES,
} from "@/lib/constants";

interface NavbarScrollbarState {
  isSubmitting: boolean;
  payWithWallet: boolean;
  hasAttemptedSubmit: boolean;
}

interface NavbarScrollbarReturn extends NavbarScrollbarState {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  setPayWithWallet: (value: boolean) => void;
  queriesRequested: number;
  userCreditsTotal: number;
  userFreeCredits: number;
  userPaidCredits: number;
  queriesUnpaid: number;
  queriesCostTotal: number;
  queryMode: QueryMode;
  updateQueryAmountRequested: (newAmount: number) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function useNavbarScrollbar(): NavbarScrollbarReturn {
  const [navbarState, setNavbarState] = useState<NavbarScrollbarState>({
    isSubmitting: false,
    payWithWallet: true,
    hasAttemptedSubmit: false,
  });
  const [queryText, setQueryText] = useState<string>("");

  const { userFreeCredits, userPaidCredits, userCreditsTotal, hasPaid: storeHasPaid, displayUnpaid } = useCreditsStore();
  const {
    queriesRequested,
    queriesUnpaid,
    queriesCostTotal,
    queryMode,
    setUserAiQueryAmountRequested,
    resetAfterSubmission,
  } = useQueryStore();

  const { submitQuery } = useSubmitQuery();

  // Sync payWithWallet with queriesUnpaid
  useEffect(() => {
    const shouldPayWithWallet = queriesUnpaid > 0;
    if (navbarState.payWithWallet !== shouldPayWithWallet) {
      setNavbarState((prev) => ({ ...prev, payWithWallet: shouldPayWithWallet }));
    }
  }, [queriesUnpaid, navbarState.payWithWallet]);

  // Update query amount with clamping
  const updateQueryAmountRequested = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(1, Math.min(ALLOWED_AMOUNT_QUERIES, newAmount));
      setUserAiQueryAmountRequested(clampedAmount, userCreditsTotal);
    },
    [setUserAiQueryAmountRequested, userCreditsTotal]
  );

  // Submit query with validation
  const handleSubmit = async () => {
    console.log("[useNavbarScrollbar] Submitting:", {
      queryText,
      queriesRequested,
      queriesUnpaid,
      payWithWallet: navbarState.payWithWallet,
      storeHasPaid,
      displayUnpaid,
    });

    // Validate query submission
    if (!queryText.trim()) {
      toast.error("Query cannot be empty", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setNavbarState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    if (queriesUnpaid > 0 && !navbarState.payWithWallet) {
      toast.error("Please enable Pay with Wallet for additional queries", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setNavbarState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    if (navbarState.payWithWallet && displayUnpaid > 0 && !storeHasPaid) {
      console.log("[useNavbarScrollbar] Blocked: Payment required", { displayUnpaid, storeHasPaid });
      toast.error("Please make a payment first", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setNavbarState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    if (userCreditsTotal > 0 && userCreditsTotal < queriesRequested) {
      toast.error("Not enough queries available", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setNavbarState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }

    setNavbarState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await submitQuery(queryText);
      resetAfterSubmission(userCreditsTotal);
      setNavbarState((prev) => ({
        ...prev,
        hasAttemptedSubmit: false,
      }));
      setQueryText("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit query";
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      console.error("[useNavbarScrollbar] Submission failed:", {
        errorMessage,
        queryText,
        queriesRequested,
        queriesUnpaid,
        payWithWallet: navbarState.payWithWallet,
        storeHasPaid,
      });
    } finally {
      setNavbarState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Handle Enter key for submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !navbarState.isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return {
    queryText,
    setQueryText,
    isSubmitting: navbarState.isSubmitting,
    payWithWallet: navbarState.payWithWallet,
    setPayWithWallet: (value) => setNavbarState((prev) => ({ ...prev, payWithWallet: value })),
    hasAttemptedSubmit: navbarState.hasAttemptedSubmit,
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