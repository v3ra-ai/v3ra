"use client";

import { useState, useCallback, useEffect, Dispatch, SetStateAction, KeyboardEvent } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for client-side navigation
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
  const router = useRouter(); // Initialize router for redirects

  const {
    queriesRequested,
    queryMode,
    setQueriesRequested,
    resetAfterSubmission,
  } = useQueryStore();

  const { submitQuery } = useSubmitQuery();

  // Log queryMode and queriesRequested on hook initialization
  console.log("[useNavbarScrollbar] Initial queryMode:", queryMode, "queriesRequested:", queriesRequested);

  // Remove payment wallet logic

  // Update query amount with clamping
  const updateQueryAmountRequested = useCallback(
    (newAmount: number) => {
      const clampedAmount = Math.max(1, Math.min(ALLOWED_AMOUNT_QUERIES, newAmount));
      console.log("[useNavbarScrollbar] Updating queriesRequested:", clampedAmount);
      setQueriesRequested(clampedAmount, 100);
    },
    [setQueriesRequested]
  );

  // Submit query with validation
  const handleSubmit = async () => {
    console.log("[useNavbarScrollbar] handleSubmit called", {
      queryText,
      queryMode,
      queriesRequested,
    });

    // Check current page
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    console.log("[useNavbarScrollbar] Current page:", currentPath);

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

    // All credit/payment validation removed - app is now free

    setNavbarState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      console.log("[useNavbarScrollbar] Submitting query with queryMode:", queryMode, "queriesRequested:", queriesRequested);
      await submitQuery(queryText, { queryMode, queriesRequested });
      console.log("[useNavbarScrollbar] Submission successful");

      // Redirect to /ask/ if on /validators
      if (currentPath === "/validators") {
        console.log("[useNavbarScrollbar] Redirecting to /ask/ from /validators");
        router.push("/ask/");
      }

      resetAfterSubmission(100);
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
    queryMode,
    updateQueryAmountRequested,
    handleKeyDown,
  };
}