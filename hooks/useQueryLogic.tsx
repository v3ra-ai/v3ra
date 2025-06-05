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
import { supabase } from "@/lib/supabase-client";

// Interface for decrementCredits response
interface DecrementCreditsResponse {
  credits?: number;
  error?: string;
  message?: string;
  success?: boolean;
}

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
  } = useQueryStore();
  const { voteHistory, lastVoteResult, setVoteHistory, setLastVoteResult } =
    useVoteStore();

  const placeholderText = getPlaceholderText(queryMode);

  console.log("[useQueryLogic] Initial queryMode:", queryMode);

  const fetchCsrfToken = async (): Promise<string> => {
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
      } catch (err) {
        attempts++;
        console.error(
          "[useQueryLogic] CSRF token fetch attempt",
          attempts,
          "failed:",
          err
        );
        if (attempts === maxAttempts) {
          throw new Error(
            err instanceof Error
              ? err.message
              : "Failed to fetch CSRF token after retries"
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error("Max CSRF token fetch attempts reached");
  };

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
        console.log("[useQueryLogic] Fetched email:", session.user.email);
      } catch (err) {
        console.error("[useQueryLogic] Error fetching email:", err);
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
      console.log("[useQueryLogic] Initial fetchAllCredits:", {
        publicKey: publicKey?.toBase58() || "none",
        email,
      });
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
        queryMode
      );
    }
  }, [queryMode]);

  useEffect(() => {
    console.log("[useQueryLogic] payWithWallet effect running:", {
      queriesUnpaid,
      currentPayWithWallet: payWithWallet,
    });
    const shouldPayWithWallet = queriesUnpaid > 0;
    if (payWithWallet !== shouldPayWithWallet) {
      console.log(
        "[useQueryLogic] Setting payWithWallet to:",
        shouldPayWithWallet
      );
      setPayWithWallet(shouldPayWithWallet);
    } else {
      console.log("[payWithWallet] No change needed for payWithWallet");
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

  const decrementCredits = async (
    walletPublicKey: string,
    creditAmount: number
  ) => {
    console.log("[useQueryLogic] Attempting to decrement credits:", {
      walletPublicKey,
      creditAmount,
      email,
      timestamp: new Date().toISOString(),
    });
    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      try {
        // Validate session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session?.user?.email) {
          console.error(
            "[useQueryLogic] Session fetch failed:",
            sessionError?.message || "No session"
          );
          throw new Error("Invalid or missing session. Please log in again.");
        }
        if (email && session.user.email !== email) {
          console.warn("[useQueryLogic] Session email mismatch:", {
            sessionEmail: session.user.email,
            storedEmail: email,
          });
          setEmail(session.user.email);
        }

        const csrfToken = await fetchCsrfToken();
        const requestBody = {
          walletPublicKey,
          creditAmount,
          email: session.user.email,
          type: "paid",
        };
        console.log(
          "[useQueryLogic] Sending decrement credits request:",
          requestBody
        );
        const response = await fetch("/api/credits/decrement", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });

        const rawBody = await response.text();
        console.log("[useQueryLogic] Decrement credits response:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          rawBody,
          timestamp: new Date().toISOString(),
        });

        let data: DecrementCreditsResponse = {};
        if (rawBody) {
          try {
            data = JSON.parse(rawBody);
          } catch (jsonError) {
            console.error(
              "[useQueryLogic] Failed to parse response JSON:",
              rawBody,
              jsonError
            );
            throw new Error(
              `Invalid server response format: ${rawBody || "Empty response"}`
            );
          }
        } else {
          console.error("[useQueryLogic] Empty response body received");
          throw new Error(
            `Server returned empty response: HTTP ${response.status} ${response.statusText}`
          );
        }

        if (!response.ok) {
          const errorMsg =
            data.error ||
            data.message ||
            rawBody ||
            `HTTP ${response.status}: ${response.statusText}`;
          console.error("[useQueryLogic] Decrement credits failed:", {
            status: response.status,
            error: errorMsg,
            data,
          });
          throw new Error(errorMsg);
        }

        console.log("[useQueryLogic] Credits decremented successfully:", data);
        return data.credits || 0;
      } catch (err) {
        attempts++;
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Unknown error decrementing credits";
        console.error(
          "[useQueryLogic] Credit decrement attempt",
          attempts,
          "failed:",
          errorMessage,
          { error: err }
        );
        if (attempts === maxAttempts || errorMessage.includes("session")) {
          throw new Error(errorMessage);
        }
        console.log("[useQueryLogic] Retrying after unauthorized error");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error("Max credit decrement attempts reached");
  };

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
      });

      if (payWithWallet && !publicKey) {
        console.log(
          "[useQueryLogic] Blocked: No wallet connected for paid query"
        );
        toast.error("Please connect your wallet to submit paid queries", {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
        return null;
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Validation failed unexpectedly";
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
      if (!payWithWallet && userFreeCredits >= queriesRequested) {
        console.log("[useQueryLogic] Processing free credits query", {
          queriesRequested,
          userFreeCredits,
          publicKey: publicKey?.toBase58() || "none",
          email,
          timestamp: new Date().toISOString(),
        });
        await decrementCreditsForQuery(queriesRequested, publicKey, email);
        await broadcastQuery(queryText, {
          csrfToken,
          queryMode,
          queriesRequested,
          isFreeQuery: true,
        });
        toast.success(
          `Query submitted, ${queriesRequested} free credits deducted!`,
          {
            style: { background: "#22c55e", color: "#ffffff" },
            duration: 5000,
          }
        );
      } else {
        console.log("[useQueryLogic] Processing paid credits query", {
          queriesRequested,
          userPaidCredits,
          publicKey: publicKey?.toBase58(),
          timestamp: new Date().toISOString(),
        });
        if (!publicKey) {
          throw new Error("Wallet not connected for paid query");
        }
        const walletPublicKey = publicKey.toBase58();
        await decrementCredits(walletPublicKey, queriesRequested);
        await broadcastQuery(queryText, {
          csrfToken,
          queryMode,
          queriesRequested,
          isFreeQuery: false,
        });
        await fetchAllCredits(publicKey, email ?? undefined);
        toast.success(
          `Query submitted, ${queriesRequested} credits deducted!`,
          {
            style: { background: "#22c55e", color: "#ffffff" },
            duration: 5000,
          }
        );
      }
      resetAfterSubmission(userCreditsTotal);
      setQueryText("");
      setPayWithWallet(queriesRequested > userCreditsTotal);
    } catch (err: unknown) {
      let errorMessage = "Failed to submit query";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        errorMessage =
          JSON.stringify(err, Object.getOwnPropertyNames(err)) || errorMessage;
      } else {
        errorMessage = String(err) || errorMessage;
      }
      setError(sanitizeQueryText(errorMessage));
      console.error("[useQueryLogic] Submission failed:", {
        error: err,
        errorMessage,
        queryText,
        queryMode,
        queriesRequested,
        queriesUnpaid,
        payWithWallet,
        storeHasPaid,
        timestamp: new Date().toISOString(),
      });
      if (errorMessage.includes("session")) {
        toast.error("Session expired. Please log in again.", {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
      } else {
        toast.error(errorMessage, {
          style: { background: "#dc2626", color: "#fee2e2" },
          duration: 5000,
        });
      }
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