"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreditsStore } from "@/store/credit-store";
import { useQueryStore } from "@/store/query-store";
import { useVoteStore } from "@/store/vote-store";
import { useBroadcastQuery } from "@/hooks/useBroadcastQuery";
import { Dispatch, SetStateAction } from "react";
import { getPlaceholderText } from "@/lib/query-utils";
import { toast } from "sonner";
import type { VoteResult } from "@/lib/types";
import { ALLOWED_AMOUNT_QUERIES } from "@/lib/constants";
import { sanitizeQueryText } from "@/utils/security-utils";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
}

export function useQueryLogic({
  payWithWallet,
  setPayWithWallet,
}: UseQueryLogicProps) {
  const [queryText, setQueryText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedCredits = useRef(false); // Track initial fetch

  const { publicKey } = useWallet();
  const { fetchSavedCredits, decrementFreeCredits } = useCreditsStore();

  const {
    userFreeCredits,
    userPaidCredits,
    userCreditsTotal,
    hasPaid: storeHasPaid,
  } = useCreditsStore();
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
  const { voteHistory, lastVoteResult, setVoteHistory, setLastVoteResult } =
    useVoteStore();

  const placeholderText = getPlaceholderText(queryMode);

  console.log("[useQueryLogic] Initial queryMode:", queryMode);

  const fetchCsrfToken = async (): Promise<string> => {
    console.log("[useQueryLogic] Starting CSRF token fetch");
    try {
      const response = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
      });
      console.log(
        "[useQueryLogic] CSRF fetch response status:",
        response.status
      );
      const data = await response.json();
      if (!response.ok || !data.csrfToken) {
        throw new Error(
          data.error || `Failed to fetch CSRF token: ${response.status}`
        );
      }
      console.log(
        "[useQueryLogic] CSRF token fetched successfully:",
        data.csrfToken
      );
      return data.csrfToken;
    } catch (err) {
      console.error("[useQueryLogic] CSRF token fetch failed:", err);
      throw new Error(
        err instanceof Error ? err.message : "Unknown error fetching CSRF token"
      );
    }
  };

  // Fetch saved credits only on initial mount
  useEffect(() => {
    if (publicKey && !hasFetchedCredits.current) {
      console.log("[useQueryLogic] Initial fetchSavedCredits:", {
        publicKey: publicKey.toBase58(),
      });
      fetchSavedCredits(publicKey);
      hasFetchedCredits.current = true;
    } else if (!publicKey && !hasFetchedCredits.current) {
      console.log("[useQueryLogic] Initial fetchSavedCredits with null publicKey");
      fetchSavedCredits(null);
      hasFetchedCredits.current = true;
    }
  }, [publicKey, fetchSavedCredits]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q === "shop") {
        setQueryMode("shop");
      }
      console.log(
        "[useQueryLogic] URL param 'q':",
        q,
        "Current queryMode:",
        queryMode
      );
    }
  }, [setQueryMode]);

  useEffect(() => {
    console.log("[useQueryLogic] payWithWallet effect running:", {
      queriesUnpaid,
      currentPayWithWallet: payWithWallet,
    });
    const shouldPayWithWallet = queriesUnpaid > 0;
    if (payWithWallet !== shouldPayWithWallet) {
      console.log("[useQueryLogic] Setting payWithWallet to:", shouldPayWithWallet);
      setPayWithWallet(shouldPayWithWallet);
    } else {
      console.log("[useQueryLogic] No change needed for payWithWallet");
    }
  }, [queriesUnpaid, payWithWallet, setPayWithWallet]);

  const handleSetVoteHistory: Dispatch<SetStateAction<VoteResult[]>> = (
    history
  ) => {
    setVoteHistory(history);
  };

  const handleSetLastVoteResult: Dispatch<SetStateAction<VoteResult | null>> = (
    result
  ) => {
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
      const clampedAmount = Math.max(
        1,
        Math.min(ALLOWED_AMOUNT_QUERIES, newAmount)
      );
      console.log("[useQueryLogic] Updating queriesRequested:", clampedAmount);
      setQueriesRequested(clampedAmount, userCreditsTotal);
    },
    [setQueriesRequested, userCreditsTotal]
  );

  const decrementCredits = async (walletPublicKey: string, creditAmount: number) => {
    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch("/api/credits/decrement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          walletPublicKey,
          creditAmount,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to decrement credits");
      }
      return data.credits;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error decrementing credits";
      console.error("[useQueryLogic] Credit decrement failed:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async () => {
    console.log("[useQueryLogic] handleSubmit called", {
      queryText,
      queryMode,
      userCreditsTotal,
      queriesRequested,
      queriesUnpaid,
      queriesCostTotal,
      payWithWallet,
      storeHasPaid,
    });

    try {
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

      if (payWithWallet && queriesUnpaid > 0 && !storeHasPaid) {
        toast.error("Please make a payment first", {
          style: { background: "#fee2e2", color: "#dc2626" },
          duration: 5000,
        });
        return;
      }

      if (userFreeCredits < queriesRequested && !payWithWallet) {
        toast.error(
          `Insufficient free credits: Need ${queriesRequested}, have ${userFreeCredits}. Please connect a wallet or purchase credits.`,
          {
            style: { background: "#fee2e2", color: "#dc2626" },
            duration: 5000,
          }
        );
        return;
      }

      if (payWithWallet && !publicKey) {
        toast.error("Please connect your wallet to submit paid queries", {
          style: { background: "#fee2e2", color: "#dc2626" },
          duration: 5000,
        });
        return;
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Validation failed unexpectedly";
      setError(sanitizeQueryText(errorMessage));
      toast.error(errorMessage, {
        style: { background: "#fee2e2", color: "#dc2626" },
        duration: 5000,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Optimistically update client-side state for free credits
      if (!payWithWallet && userFreeCredits >= queriesRequested) {
        decrementFreeCredits(queriesRequested);
        const csrfToken = await fetchCsrfToken();
        await broadcastQuery(queryText, {
          csrfToken,
          queryMode,
          queriesRequested,
        });
        toast.success(`Query submitted, ${queriesRequested} free credits deducted!`);
      } else {
        // Paid queries require wallet and server-side decrement
        const walletPublicKey = publicKey!.toBase58();
        await decrementCredits(walletPublicKey, queriesRequested);
        const csrfToken = await fetchCsrfToken();
        await broadcastQuery(queryText, {
          csrfToken,
          queryMode,
          queriesRequested,
        });
        await fetchSavedCredits(publicKey); // Refresh credits after payment
        toast.success(`Query submitted, ${queriesRequested} credits deducted!`);
      }
      resetAfterSubmission(userCreditsTotal);
      setQueryText("");
      setPayWithWallet(queriesRequested > userCreditsTotal);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit query";
      setError(sanitizeQueryText(errorMessage));
      console.error("[useQueryLogic] Submission failed:", {
        errorMessage,
        queryText,
        queryMode,
        queriesRequested,
        queriesUnpaid,
        payWithWallet,
        storeHasPaid,
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