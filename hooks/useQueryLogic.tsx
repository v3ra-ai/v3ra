"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
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
import { supabase } from "@/lib/supabase-client";
import { useLLMStore } from "@/store/llm-store";

interface UseQueryLogicProps {
  payWithWallet: boolean;
  setPayWithWallet: Dispatch<SetStateAction<boolean>>;
}

export default function useQueryLogic({
  payWithWallet,
  setPayWithWallet,
}: UseQueryLogicProps) {
  const [queryText, setQueryTextRaw] = useState<string>("");
  const setQueryText = useCallback((value: string | ((prev: string) => string)) => {
    setQueryTextRaw(value);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const hasFetchedCredits = useRef(false);

  const { publicKey } = useWallet();
  const {
    fetchAllCredits,
    decrementCreditsForQuery,
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
    resetAfterSubmission,
    selectedLLMIds,
  } = useQueryStore();
  const { voteHistory, lastVoteResult, setVoteHistory, setLastVoteResult } =
    useVoteStore();
  const { llms } = useLLMStore();

  const placeholderText = getPlaceholderText(queryMode);

  // console.log("[useQueryLogic] Initial queryMode:", queryMode);

  const fetchCsrfToken = useCallback(async (): Promise<string> => {
    console.log("[useQueryLogic] Starting CSRF token fetch");
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const response = await fetch("/api/csrf-token", {
          method: "GET",
          credentials: "include",
        });
        console.log("[useQueryLogic] CSRF fetch response:", {
          status: response.status,
          headers: Object.fromEntries(response.headers),
          timestamp: new Date().toISOString(),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.error || `Failed to fetch CSRF token: ${response.status}`
          );
        }
        if (
          !data.csrfToken ||
          typeof data.csrfToken !== "string" ||
          data.csrfToken.length < 10
        ) {
          throw new Error("Invalid CSRF token format");
        }
        console.log(
          "[useQueryLogic] CSRF token fetched successfully:",
          data.csrfToken
        );
        return data.csrfToken;
      } catch {
        attempts++;
        console.error(
          "[useQueryLogic] CSRF token fetch attempt",
          attempts,
          "failed",
          { timestamp: new Date().toISOString() }
        );
        if (attempts === maxAttempts) {
          throw new Error("Failed to fetch CSRF token after retries");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error("Max CSRF token fetch attempts reached");
  }, []);

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session?.user?.email) {
          console.warn(
            "[useQueryLogic] No active session found during email fetch"
          );
          toast.error("Closed beta: Please log in to get free credits.", {
            className:
              "bg-red-600 text-red-100 border border-red-800 p-4 rounded-lg text-2xl font-medium",
            duration: 10000,
          });
          return;
        }

        setEmail(session.user.email);
        // console.log("[useQueryLogic] Fetched email:", session.user.email, {
        //   timestamp: new Date().toISOString(),
        // });
      } catch {
        console.error("[useQueryLogic] Error fetching email", {
          timestamp: new Date().toISOString(),
        });
        toast.error("Failed to fetch user session. Please log in again.", {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
      }
    };
    fetchEmail();
  }, []);

  // Fetch saved credits only on initial mount
  useEffect(() => {
    if (!hasFetchedCredits.current && email) {
      // console.log("[useQueryLogic] Initial fetchAllCredits:", {
      //   publicKey: publicKey?.toBase58() || "none",
      //   email,
      //   timestamp: new Date().toISOString(),
      // });
      fetchAllCredits(publicKey, email);
      hasFetchedCredits.current = true;
    }
  }, [publicKey, email, fetchAllCredits]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q === "shop") {
        console.log(
          "[useQueryLogic] URL param 'q' is 'shop', current queryMode:",
          queryMode
        );
      }
      console.log(
        "[useQueryLogic] URL param 'q':",
        q,
        "Current queryMode:",
        queryMode,
        { timestamp: new Date().toISOString() }
      );
    }
  }, [queryMode]);

  useEffect(() => {
    // console.log("[useQueryLogic] payWithWallet effect running:", {
    //   queriesUnpaid,
    //   currentPayWithWallet: payWithWallet,
    //   timestamp: new Date().toISOString(),
    // });
    const shouldPayWithWallet = queriesUnpaid > 0;
    if (payWithWallet !== shouldPayWithWallet) {
      console.log(
        "[useQueryLogic] Setting payWithWallet to:",
        shouldPayWithWallet,
        { timestamp: new Date().toISOString() }
      );
      setPayWithWallet(shouldPayWithWallet);
    } else {
      console.log("[payWithWallet] No change needed for payWithWallet", {
        timestamp: new Date().toISOString(),
      });
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
      console.log("[useQueryLogic] Updating queriesRequested:", clampedAmount, {
        timestamp: new Date().toISOString(),
      });
      setQueriesRequested(clampedAmount, userCreditsTotal);
    },
    [setQueriesRequested, userCreditsTotal]
  );

  const handleSubmit = async () => {
    console.log("[useQueryLogic] handleSubmit called", {
      queryText,
      queryMode,
      userCreditsTotal,
      userFreeCredits,
      userPaidCredits,
      queriesRequested,
      queriesUnpaid,
      queriesCostTotal,
      payWithWallet,
      storeHasPaid,
      creditsLeft: userCreditsTotal - queriesRequested,
      selectedLLMIds,
      timestamp: new Date().toISOString(),
    });

    try {
      if (!queryText.trim()) {
        toast.error("Query cannot be empty", {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
        return null;
      }

      const creditsLeft = Math.max(0, userCreditsTotal - queriesRequested);
      console.log("[useQueryLogic] Credit check:", {
        creditsLeft,
        queriesCostTotal,
        userCreditsTotal,
        queriesRequested,
        sufficientCredits: creditsLeft >= queriesCostTotal,
        timestamp: new Date().toISOString(),
      });

      if (creditsLeft < queriesCostTotal) {
        console.log("[useQueryLogic] Blocked: Insufficient total credits", {
          creditsLeft,
          queriesCostTotal,
          timestamp: new Date().toISOString(),
        });
        toast.error("Insufficient credits to cover the query cost", {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
        return null;
      }

      const selectedLLMs = llms.filter((llm) => llm.enabled);
      if (selectedLLMs.length > 0 && queriesRequested > selectedLLMs.length) {
        console.log("[useQueryLogic] Blocked: Queries requested exceeds selected LLMs", {
          queriesRequested,
          selectedLLMCount: selectedLLMs.length,
        });
        toast.error(`Cannot query ${queriesRequested} AIs when only ${selectedLLMs.length} are selected.`, {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
        return null;
      }
    } catch {
      const errorMessage = "Validation failed unexpectedly";
      setError(sanitizeQueryText(errorMessage));
      toast.error(errorMessage, {
        style: { background: "#dc2626", color: "#fee2e2" },
        duration: 5000,
      });
      setIsSubmitting(false);
      return null;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const csrfToken = await fetchCsrfToken();
      console.log("[useQueryLogic] Processing query with decrementCreditsForQuery", {
        queriesRequested,
        userFreeCredits,
        userPaidCredits,
        publicKey: publicKey?.toBase58() || "none",
        email,
        payWithWallet,
        csrfToken: csrfToken ? "[REDACTED]" : undefined,
        selectedLLMIds,
        timestamp: new Date().toISOString(),
      });
      await decrementCreditsForQuery(queriesRequested, publicKey, email, csrfToken);
      await broadcastQuery({
        query: queryText,
        options: {
          csrfToken,
          queryMode,
          queriesRequested,
          isFreeQuery: userFreeCredits >= queriesRequested,
          selectedLLMIds,
        },
      });
      await fetchAllCredits(publicKey, email ?? undefined, true);
      toast.success(
        `Query submitted, ${queriesRequested} credits deducted!`,
        {
          style: { background: "#22c55e", color: "#ffffff" },
          duration: 5000,
        }
      );
      resetAfterSubmission(userCreditsTotal);
      setQueryText("");
      setPayWithWallet(queriesRequested > userCreditsTotal);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit query";
      setError(sanitizeQueryText(errorMessage));
      console.error("[useQueryLogic] Submission failed:", {
        errorMessage,
        queryText,
        queryMode,
        queriesRequested,
        queriesUnpaid,
        payWithWallet,
        storeHasPaid,
        selectedLLMIds,
        timestamp: new Date().toISOString(),
      });
      toast.error(errorMessage, {
        style: { background: "#dc2626", color: "#fee2e2" },
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