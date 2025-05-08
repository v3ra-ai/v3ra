"use client";

import { useState, useCallback, useEffect, Dispatch, SetStateAction, KeyboardEvent } from "react";
import { useCreditsStore } from "@/store/credit-store";
import { useQueryStore } from "@/store/query-store";
import { QueryMode } from "@/lib/types";
import { useSubmitQuery } from "@/hooks/useSubmitQuery";
import { toast } from "sonner";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";

// Log to confirm file is loaded
console.log("[useNavbarScrollbar] File loaded");

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

  // Log queryMode and queriesRequested on hook initialization
  console.log("[useNavbarScrollbar] Initial queryMode:", queryMode, "queriesRequested:", queriesRequested);

  // Sync payWithWallet with queriesUnpaid
  useEffect(() => {
    const shouldPayWithWallet = queriesUnpaid > 0;
    if (navbarState.payWithWallet !== shouldPayWithWallet) {
      console.log("[useNavbarScrollbar] Syncing payWithWallet:", shouldPayWithWallet);
      setNavbarState((prev) => ({ ...prev, payWithWallet: shouldPayWithWallet }));
    }
  }, [queriesUnpaid, navbarState.payWithWallet]);

  // Update query amount with clamping
  const updateQueryAmountRequested = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(1, Math.min(ALLOWED_AMOUNT_QUERIES, newAmount));
      console.log("[useNavbarScrollbar] Updating queriesRequested:", clampedAmount);
      setUserAiQueryAmountRequested(clampedAmount, userCreditsTotal);
    },
    [setUserAiQueryAmountRequested, userCreditsTotal]
  );

  // Submit query with validation
  const handleSubmit = async () => {
    console.log("[useNavbarScrollbar] handleSubmit called", {
      queryText,
      queryMode,
      queriesRequested,
      queriesUnpaid,
      payWithWallet: navbarState.payWithWallet,
      storeHasPaid,
      displayUnpaid,
    });

    // Validate query submission
    console.log("[useNavbarScrollbar] Checking query text:", queryText);
    if (!queryText.trim()) {
      console.log("[useNavbarScrollbar] Validation failed: Query cannot be empty");
      toast.error("Query cannot be empty", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setNavbarState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    console.log("[useNavbarScrollbar] Query text validation passed");

    console.log("[useNavbarScrollbar] Checking queriesUnpaid and payWithWallet:", { queriesUnpaid, payWithWallet: navbarState.payWithWallet });
    if (queriesUnpaid > 0 && !navbarState.payWithWallet) {
      console.log("[useNavbarScrollbar] Validation failed: Pay with Wallet required");
      toast.error("Please enable Pay with Wallet for additional queries", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setNavbarState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    console.log("[useNavbarScrollbar] Wallet validation passed");

    console.log("[useNavbarScrollbar] Checking payment status:", { payWithWallet: navbarState.payWithWallet, queriesUnpaid, storeHasPaid });
    if (navbarState.payWithWallet && displayUnpaid > 0 && !storeHasPaid) {
      console.log("[useNavbarScrollbar] Validation failed: Payment required", { displayUnpaid, storeHasPaid });
      toast.error("Please make a payment first", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setNavbarState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    console.log("[useNavbarScrollbar] Payment validation passed");

    console.log("[useNavbarScrollbar] Checking credit availability:", { userCreditsTotal, queriesRequested });
    if (userCreditsTotal > 0 && userCreditsTotal < queriesRequested) {
      console.log("[useNavbarScrollbar] Validation failed: Not enough queries available");
      toast.error("Not enough queries available", {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setNavbarState((prev) => ({ ...prev, hasAttemptedSubmit: true }));
      return;
    }
    console.log("[useNavbarScrollbar] Credit validation passed");

    setNavbarState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      console.log("[useNavbarScrollbar] Submitting query with queryMode:", queryMode, "queriesRequested:", queriesRequested);
      await submitQuery(queryText, { queryMode, queriesRequested }); // Pass queryMode and queriesRequested
      console.log("[useNavbarScrollbar] Submission successful");
      resetAfterSubmission(userCreditsTotal);
      setNavbarState((prev) => ({
        ...prev,
        hasAttemptedSubmit: false,
      }));
      setQueryText("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit query";
      console.error("[useNavbarScrollbar] Submission failed:", {
        errorMessage,
        queryText,
        queryMode,
        queriesRequested,
        queriesUnpaid,
        payWithWallet: navbarState.payWithWallet,
        storeHasPaid,
      });
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
    } finally {
      setNavbarState((prev) => ({ ...prev, isSubmitting: false }));
      console.log("[useNavbarScrollbar] Submission completed, isSubmitting:", false);
    }
  };

  // Handle Enter key for submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !navbarState.isSubmitting) {
      e.preventDefault();
      console.log("[useNavbarScrollbar] Enter key pressed, triggering handleSubmit");
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